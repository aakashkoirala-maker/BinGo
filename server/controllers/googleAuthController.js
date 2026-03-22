const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Verify Google Access Token and Login/Register
exports.googleLogin = async (req, res) => {
    const { access_token } = req.body;

    if (!access_token) {
        return res.status(400).json({ message: 'Google access token is required' });
    }

    try {
        // Use the access token to get user info from Google
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (!googleRes.ok) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }

        const googleUser = await googleRes.json();
        const { email, name, picture } = googleUser;

        if (!email) {
            return res.status(400).json({ message: 'Could not get email from Google' });
        }

        // Check if user already exists
        const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        let user;

        if (users.length > 0) {
            // User exists - log them in
            user = users[0];
        } else {
            // New user - register them (no password needed)
            const [result] = await db.promise().query(
                'INSERT INTO users (full_name, email, password_hash, role, auth_provider) VALUES (?, ?, ?, ?, ?)',
                [name, email, null, 'citizen', 'google']
            );
            user = { id: result.insertId, full_name: name, email, role: 'citizen' };
        }

        // Generate our app's JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });

        res.status(200).json({
            message: 'Google Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
};
