const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const VALID_ROLES = ['citizen', 'worker', 'admin'];

const WORKER_PASSWORD_FILES = [
    path.join(__dirname, 'workerPasswords.json'),
    path.join(__dirname, '..', 'workerPasswords.json'),
    path.join(__dirname, '..', 'config', 'workerPasswords.json')
];

const loadWorkerPassword = (workerId) => {
    for (const filePath of WORKER_PASSWORD_FILES) {
        try {
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const entry = data?.[workerId];
                if (entry?.password) return entry.password;
            }
        } catch (err) {
            console.warn('[AUTH] Failed to read worker password file', filePath, err.message);
        }
    }
    return null;
};

const ensureResetTable = async () => {
    await db.promise().query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash VARCHAR(128) NOT NULL,
            expires_at BIGINT NOT NULL,
            used_at BIGINT DEFAULT NULL,
            created_at BIGINT NOT NULL,
            INDEX idx_user_token (user_id, token_hash)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
};

// Register User
exports.register = async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user exists
        const [existingUsers] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Only allow citizens to self-register; workers/admins require provisioning
        const normalizedRole = VALID_ROLES.includes(role) && role === 'citizen' ? 'citizen' : 'citizen';

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert User
        const [result] = await db.promise().query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [fullName, email, passwordHash, normalizedRole]
        );

        // Generate Token
        const token = jwt.sign({ id: result.insertId, role: normalizedRole }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });

        res.status(201).json({ message: 'User registered successfully', token, user: { id: result.insertId, fullName, email, role: normalizedRole } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login User
exports.login = async (req, res) => {
    const { email, password, role: selectedRole } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = selectedRole ? String(selectedRole).trim().toLowerCase() : null;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Find User (case-insensitive email match)
        const [users] = await db.promise().query('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        const userRole = String(user.role || '').trim().toLowerCase();

        // Enforce role matching to prevent role bypass
        if (normalizedRole && userRole !== normalizedRole) {
            return res.status(403).json({ message: 'Role mismatch. Please select the correct role.' });
        }

        // Check Password
        const hasHash = Boolean(user.password_hash);
        const hashMatch = hasHash ? await bcrypt.compare(password, user.password_hash) : false;

        let fallbackMatch = false;
        if (!hashMatch && userRole === 'worker') {
            const storedPassword = loadWorkerPassword(String(user.id));
            if (storedPassword && storedPassword === password) {
                fallbackMatch = true;
                // Backfill hashed password so future logins succeed without file
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash(password, salt);
                await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
            }
        }

        if (!hashMatch && !fallbackMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });

        res.status(200).json({ message: 'Login successful', token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Social Login (Google / Facebook / Apple)
exports.socialLogin = async (req, res) => {
    const { email, fullName, provider } = req.body;

    if (!email || !fullName) {
        return res.status(400).json({ message: 'Email and Name are required' });
    }

    try {
        // Check if user already exists
        const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        let user;

        if (users.length > 0) {
            // User exists - just log them in
            user = users[0];
        } else {
            // New user - register them (no password needed for social login)
            const [result] = await db.promise().query(
                'INSERT INTO users (full_name, email, password_hash, role, auth_provider) VALUES (?, ?, ?, ?, ?)',
                [fullName, email, null, 'citizen', provider || 'google']
            );
            user = { id: result.insertId, full_name: fullName, email, role: 'citizen' };
        }

        // Generate Token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });

        res.status(200).json({
            message: 'Social Login successful',
            token,
            user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        await ensureResetTable();

        const [users] = await db.promise().query('SELECT id, role FROM users WHERE email = ?', [email]);
        const normalizedRole = users[0]?.role ? String(users[0].role).trim().toLowerCase() : '';
        if (users.length === 0 || normalizedRole !== 'citizen') {
            return res.status(400).json({ message: 'Password reset is only available for citizen accounts.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = Date.now() + 1000 * 60 * 30; // 30 minutes

        // Invalidate existing tokens for this user
        await db.promise().query('DELETE FROM password_reset_tokens WHERE user_id = ?', [users[0].id]);

        await db.promise().query(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)',
            [users[0].id, tokenHash, expiresAt, Date.now()]
        );

        // In production, send email. For now, return token and a local reset link for dev/demo.
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        return res.status(200).json({ message: 'Reset token generated', token, expiresAt, resetLink, email });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword, email } = req.body;

    if (!token || !newPassword || !email) {
        return res.status(400).json({ message: 'Token, email, and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await db.promise().query('SELECT id, role FROM users WHERE email = ?', [email]);
    const normalizedRole = users[0]?.role ? String(users[0].role).trim().toLowerCase() : '';
    if (users.length === 0 || normalizedRole !== 'citizen') {
        return res.status(400).json({ message: 'Password reset is only available for citizen accounts.' });
    }

    await ensureResetTable();

    const [rows] = await db.promise().query(
        'SELECT id, expires_at, used_at FROM password_reset_tokens WHERE user_id = ? AND token_hash = ? LIMIT 1',
        [users[0].id, tokenHash]
    );

    if (rows.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const record = rows[0];

    if (record.used_at) {
        return res.status(400).json({ message: 'Token already used' });
    }

    if (record.expires_at < Date.now()) {
        await db.promise().query('DELETE FROM password_reset_tokens WHERE id = ?', [record.id]);
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        await db.promise().query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, users[0].id]);
        await db.promise().query('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?', [Date.now(), record.id]);

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};
