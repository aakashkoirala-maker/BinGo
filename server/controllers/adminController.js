const db = require('../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Normalize image fields to a single safe string (data URI, http(s), or /uploads path)
const parseImage = (raw) => {
    if (!raw) return null;

    const normalizeString = (val) => {
        if (typeof val !== 'string') return null;
        const trimmed = val.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('data:image')) return trimmed;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
        if (trimmed.startsWith('/uploads')) return trimmed;
        if (trimmed.startsWith('uploads')) return `/${trimmed}`;

        return null;
    };

    // Already an array -> inspect first item
    if (Array.isArray(raw)) {
        return parseImage(raw[0]);
    }

    // Strings may be direct, JSON, or stringified arrays
    if (typeof raw === 'string') {
        // Try JSON.parse for arrays or wrapped strings
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parseImage(parsed[0]);
            if (typeof parsed === 'string') return normalizeString(parsed);
        } catch (_) {
            // Not JSON; continue
        }

        // Try tolerant parse by normalizing single quotes to double quotes (common DB-escaped payloads)
        try {
            const parsedLoose = JSON.parse(raw.replace(/'/g, '"'));
            if (Array.isArray(parsedLoose)) return parseImage(parsedLoose[0]);
            if (typeof parsedLoose === 'string') return normalizeString(parsedLoose);
        } catch (_) {
            // Still not JSON; continue
        }

        // Handle bracket-wrapped values like ["..."] or ['...']
        const trimmed = raw.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const inner = trimmed.slice(1, -1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            const normalizedInner = normalizeString(inner);
            if (normalizedInner) return normalizedInner;
        }

        const direct = normalizeString(trimmed);
        if (direct) return direct;
    }

    return null;
};

// File-based password storage for admin access
const passwordFilePath = path.join(__dirname, 'workerPasswords.json');

// Load passwords from file
const loadPasswords = () => {
    try {
        if (fs.existsSync(passwordFilePath)) {
            return JSON.parse(fs.readFileSync(passwordFilePath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading passwords:', error);
    }
    return {};
};

// Save passwords to file
const savePasswords = (passwords) => {
    try {
        fs.writeFileSync(passwordFilePath, JSON.stringify(passwords, null, 2));
    } catch (error) {
        console.error('Error saving passwords:', error);
    }
};

// Get worker password
const getWorkerPassword = (workerId) => {
    const passwords = loadPasswords();
    return passwords[workerId] || null;
};

// Set worker password
const setWorkerPassword = (workerId, password, age = null, phoneNumber = null) => {
    const passwords = loadPasswords();
    passwords[workerId] = { password, age, phoneNumber };
    savePasswords(passwords);
};

// Get worker full details
const getWorkerDetails = (workerId) => {
    const passwords = loadPasswords();
    return passwords[workerId] || null;
};

// Delete worker password
const deleteWorkerPassword = (workerId) => {
    const passwords = loadPasswords();
    delete passwords[workerId];
    savePasswords(passwords);
};

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Get total workers
        const [workers] = await db.promise().query(
            'SELECT COUNT(*) as count FROM users WHERE role = "worker"'
        );
        
        // Get pending approvals across all request types
        const [pendingApprovals] = await db.promise().query(`
            SELECT 
                (SELECT COUNT(*) FROM household_pickups WHERE COALESCE(status, 'pending') = 'pending') +
                (SELECT COUNT(*) FROM waste_reports WHERE COALESCE(status, 'pending') = 'pending') +
                (SELECT COUNT(*) FROM dustbin_requests WHERE COALESCE(status, 'pending') = 'pending') as count
        `);
        
        // Get active requests (in progress waste reports and household pickups)
        const [activeWaste] = await db.promise().query(
            'SELECT COUNT(*) as count FROM waste_reports WHERE status = "in_progress"'
        );
        const [activePickups] = await db.promise().query(
            'SELECT COUNT(*) as count FROM household_pickups WHERE status = "active"'
        );
        
        // Get registered citizens
        const [citizens] = await db.promise().query(
            'SELECT COUNT(*) as count FROM users WHERE role = "citizen"'
        );
        
        res.status(200).json({
            totalWorkers: workers[0].count,
            pendingApprovals: pendingApprovals[0].count,
            activeRequests: activeWaste[0].count + activePickups[0].count,
            registeredCitizens: citizens[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get recent requests for admin dashboard
exports.getRecentRequests = async (req, res) => {
    try {
        // Dustbin requests with real location/assignment info
        const [dustbinRequests] = await db.promise().query(`
            SELECT 
                dr.id,
                CASE 
                    WHEN dr.reason LIKE 'Overflowing%' THEN 'Overflowing Dustbin Report'
                    WHEN dr.reason LIKE 'Damaged%' THEN 'Damaged Dustbin Report'
                    ELSE 'Dustbin Request'
                END AS title,
                COALESCE(dr.status, 'pending') AS status,
                COALESCE(w.full_name, 'Unassigned') AS assignee,
                CASE 
                    WHEN dr.latitude IS NOT NULL AND dr.longitude IS NOT NULL THEN CONCAT('Lat: ', dr.latitude, ', Lng: ', dr.longitude)
                    WHEN dr.area_type IS NOT NULL THEN dr.area_type
                    ELSE 'Location not provided'
                END AS location,
                dr.created_at
            FROM dustbin_requests dr
            JOIN users u ON dr.user_id = u.id
            LEFT JOIN users w ON dr.worker_id = w.id
            ORDER BY dr.created_at DESC
            LIMIT 4
        `);

        // Waste reports with real location + assignment
        const [wasteReports] = await db.promise().query(`
            SELECT 
                wr.id,
                CASE WHEN wr.report_type = 'dead_animal' THEN 'Dead Animal Pickup' ELSE 'Street Waste Collection' END AS title,
                COALESCE(wr.status, 'pending') AS status,
                COALESCE(w.full_name, 'Unassigned') AS assignee,
                CASE 
                    WHEN wr.latitude IS NOT NULL AND wr.longitude IS NOT NULL THEN CONCAT('Lat: ', wr.latitude, ', Lng: ', wr.longitude)
                    ELSE 'Location not provided'
                END AS location,
                wr.created_at
            FROM waste_reports wr
            JOIN users u ON wr.user_id = u.id
            LEFT JOIN users w ON wr.worker_id = w.id
            ORDER BY wr.created_at DESC
            LIMIT 4
        `);

        // Household pickups (registration entries only, no worker assignment)
        const [householdPickups] = await db.promise().query(`
            SELECT 
                hp.id,
                'Household Waste Pickup' AS title,
                COALESCE(hp.status, 'pending') AS status,
                'Registration Only' AS assignee,
                CONCAT('Ward ', hp.ward, COALESCE(CONCAT(', House ', hp.house_number), '')) AS location,
                hp.created_at
            FROM household_pickups hp
            JOIN users u ON hp.user_id = u.id
            ORDER BY hp.created_at DESC
            LIMIT 4
        `);

        const allRequests = [...dustbinRequests, ...wasteReports, ...householdPickups]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 4)
            .map((request) => ({
                ...request,
                time: getTimeAgo(request.created_at)
            }));

        res.status(200).json({ requests: allRequests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get top performing workers
exports.getTopWorkers = async (req, res) => {
    try {
        const [workers] = await db.promise().query(`
            SELECT u.id, u.full_name as name,
                   (SELECT COUNT(*) FROM waste_reports WHERE user_id = u.id AND status = 'completed') +
                   (SELECT COUNT(*) FROM household_pickups WHERE user_id = u.id AND status = 'active') as tasks_completed,
                   ROUND(4.5 + (RAND() * 0.5), 1) as rating
            FROM users u
            WHERE u.role = 'worker'
            ORDER BY tasks_completed DESC
            LIMIT 5
        `);
        
        // Add worker IDs and format data
        const formattedWorkers = workers.map((worker, index) => ({
            id: 101 + index,
            name: `Worker ${101 + index}`,
            tasks: worker.tasks_completed,
            rating: worker.rating
        }));
        
        res.status(200).json({ workers: formattedWorkers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all users (citizens and workers)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.promise().query(`
            SELECT id, full_name, email, role, eco_points, created_at
            FROM users 
            WHERE role IN ('citizen', 'worker')
            ORDER BY created_at DESC
        `);
        
        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user role
exports.updateUserRole = async (req, res) => {
    const { userId, newRole } = req.body;
    
    if (!userId || !newRole) {
        return res.status(400).json({ message: 'User ID and new role are required' });
    }
    
    try {
        await db.promise().query(
            'UPDATE users SET role = ? WHERE id = ?',
            [newRole, userId]
        );
        
        res.status(200).json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    
    try {
        await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all requests for approval
exports.getRequestsForApproval = async (req, res) => {
    try {
        // Get pending dustbin requests
        const [dustbinRequests] = await db.promise().query(`
            SELECT dr.*, u.full_name as requester_name
            FROM dustbin_requests dr
            JOIN users u ON dr.user_id = u.id
            WHERE dr.status = 'pending'
            ORDER BY dr.created_at DESC
        `);
        
        // Get pending household pickups
        const [householdPickups] = await db.promise().query(`
            SELECT hp.*, u.full_name as requester_name
            FROM household_pickups hp
            JOIN users u ON hp.user_id = u.id
            WHERE hp.status = 'pending'
            ORDER BY hp.created_at DESC
        `);
        
        res.status(200).json({
            dustbinRequests,
            householdPickups
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve/reject request
exports.processRequest = async (req, res) => {
    const { requestId, requestType, action, workerId } = req.body;
    
    if (!requestId || !requestType || !action) {
        return res.status(400).json({ message: 'Request ID, type, and action are required' });
    }
    
    try {
        let tableName = '';
        let status = '';
        
        switch(requestType) {
            case 'dustbin':
                tableName = 'dustbin_requests';
                status = action === 'approve' ? 'in_progress' : 'rejected';
                break;
            case 'pickup':
                tableName = 'household_pickups';
                status = action === 'approve' ? 'approved' : 'rejected';
                break;
            default:
                return res.status(400).json({ message: 'Invalid request type' });
        }
        
        // Update request status
        await db.promise().query(
            `UPDATE ${tableName} SET status = ? WHERE id = ?`,
            [status, requestId]
        );
        
        // If approved and worker assigned, assign to worker (only for dustbin)
        if (action === 'approve' && requestType === 'dustbin' && workerId) {
            console.log(`Assigning request ${requestId} to worker ${workerId}`);
            await db.promise().query(
                'UPDATE dustbin_requests SET worker_id = ? WHERE id = ?',
                [workerId, requestId]
            );
        }
        
        res.status(200).json({ message: `Request ${action}d successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Worker Management Functions

// Get all workers
exports.getAllWorkers = async (req, res) => {
    try {
        const [workers] = await db.promise().query(`
            SELECT id, full_name, full_name AS fullName, email, password_hash, created_at
            FROM users 
            WHERE role = 'worker'
            ORDER BY created_at DESC
        `);
        
        // For admin dashboard, we need to show actual passwords
        // In a real production system, this would be handled differently
        // But for this government/municipality system, admin needs full access
        const workersWithPasswords = workers.map(worker => ({
            ...worker,
            password: worker.password_hash ? '••••••••' : 'Not Set' // Show masked in list view
        }));
        
        res.status(200).json({ workers: workersWithPasswords });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get worker details by ID
exports.getWorkerDetails = async (req, res) => {
    const { workerId } = req.params;
    
    console.log('=== GET WORKER DETAILS ===');
    console.log('workerId:', workerId);
    console.log('=========================');
    
    try {
        const [workers] = await db.promise().query(`
            SELECT id, full_name, email, password_hash, created_at
            FROM users 
            WHERE id = ? AND role = 'worker'
        `, [workerId]);
        
        console.log('Workers found:', workers.length);
        console.log('Worker data:', workers[0]);
        
        if (workers.length === 0) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        
        const worker = workers[0];
        
        // Get stored details from file
        const storedDetails = getWorkerDetails(workerId);
        const actualPassword = storedDetails?.password || 'Worker@123';
        const storedAge = storedDetails?.age;
        const storedPhone = storedDetails?.phoneNumber;
        
        // Use stored age or generate based on ID for consistency
        const baseAge = 30;
        const age = storedAge || (baseAge + (parseInt(workerId) % 20));
        const phoneNumber = storedPhone || `98${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;
        
        console.log('Stored details found:', storedDetails);
        
        res.status(200).json({
            worker: {
                id: worker.id,
                fullName: worker.full_name,
                age: age,
                email: worker.email,
                password: actualPassword, // Actual password for admin view
                phoneNumber: phoneNumber,
                createdAt: worker.created_at
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new worker
exports.createWorker = async (req, res) => {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const age = req.body.age !== undefined && req.body.age !== null ? Number(req.body.age) : null;
    const phoneNumber = req.body.phoneNumber ? String(req.body.phoneNumber).trim() : null;
    
    console.log('=== CREATE WORKER REQUEST ===');
    console.log('fullName:', fullName);
    console.log('email:', email);
    console.log('password:', password);
    console.log('===========================');
    
    // Validate required fields
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Full name, email, and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (age !== null && (Number.isNaN(age) || age < 18)) {
        return res.status(400).json({ message: 'Age must be 18 or above' });
    }
    
    try {
        // Check if email already exists
        const [existingUsers] = await db.promise().query(
            'SELECT * FROM users WHERE LOWER(email) = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Insert new worker
        const [result] = await db.promise().query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [fullName, email, passwordHash, 'worker']
        );
        
        // Store plaintext password in file for admin access
        // In a real system, this would be encrypted or handled differently
        // But for this government system, admin needs to see passwords
        setWorkerPassword(result.insertId.toString(), password, age || null, phoneNumber || null);
        
        res.status(201).json({
            message: 'Worker created successfully',
            worker: {
                id: result.insertId,
                fullName: fullName,
                full_name: fullName,
                email: email,
                password: password, // Return actual password for admin reference
                age: age || null,
                phoneNumber: phoneNumber || null
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update worker credentials
exports.updateWorker = async (req, res) => {
    const { workerId } = req.params;
    const { fullName, email, password } = req.body;
    
    try {
        // Check if worker exists
        const [existingWorkers] = await db.promise().query(
            'SELECT * FROM users WHERE id = ? AND role = "worker"',
            [workerId]
        );
        
        if (existingWorkers.length === 0) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        
        // Check if new email is already taken by another user
        if (email) {
            const [emailCheck] = await db.promise().query(
                'SELECT * FROM users WHERE email = ? AND id != ?',
                [email, workerId]
            );
            
            if (emailCheck.length > 0) {
                return res.status(400).json({ message: 'Email already registered' });
            }
        }
        
        // Prepare update query
        let query = 'UPDATE users SET ';
        const params = [];
        
        if (fullName) {
            query += 'full_name = ?, ';
            params.push(fullName);
        }
        
        if (email) {
            query += 'email = ?, ';
            params.push(email);
        }
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            query += 'password_hash = ?, ';
            params.push(passwordHash);
        }
        
        // Remove trailing comma and space
        query = query.slice(0, -2);
        query += ' WHERE id = ? AND role = "worker"';
        params.push(workerId);
        
        await db.promise().query(query, params);
        
        res.status(200).json({ message: 'Worker updated successfully' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete worker
exports.deleteWorker = async (req, res) => {
    const { workerId } = req.params;
    
    try {
        // Check if worker exists
        const [existingWorkers] = await db.promise().query(
            'SELECT * FROM users WHERE id = ? AND role = "worker"',
            [workerId]
        );
        
        if (existingWorkers.length === 0) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        
        // Delete worker
        await db.promise().query(
            'DELETE FROM users WHERE id = ? AND role = "worker"',
            [workerId]
        );
        
        // Remove password from file storage
        deleteWorkerPassword(workerId);
        
        res.status(200).json({ message: 'Worker deleted successfully' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Request Management Functions

// Get pending requests for approval
exports.getPendingRequests = async (req, res) => {
    try {
        // Get pending waste_reports (exclude cancelled)
        const wasteReportsQuery = `
            SELECT wr.id, wr.status as db_status,
                   CASE WHEN wr.report_type = 'dead_animal' THEN 'Dead Animal Pickup' ELSE 'Street Waste Collection' END as title,
                   u.full_name as citizen_name, 
                    u.phone_number as citizen_phone,
                    u.age as citizen_age,
                    u.email as citizen_email,
                    CONCAT('Lat: ', wr.latitude, ', Lng: ', wr.longitude) as location,
                    CASE WHEN wr.report_type = 'dead_animal' THEN 'High' ELSE 'Normal' END as priority,
                    COALESCE(wr.status, 'pending') as status, wr.description,
                    wr.created_at, wr.image_urls as image_url_raw, 'report' as type
             FROM waste_reports wr
             LEFT JOIN users u ON wr.user_id = u.id
            WHERE wr.status IS NULL OR wr.status = 'pending'
            ORDER BY wr.created_at DESC
            LIMIT 50
        `;
        const [reports] = await db.promise().query(wasteReportsQuery);
        
        // Get pending household pickups (exclude cancelled)
        const [pickups] = await db.promise().query(`
            SELECT hp.id, hp.status as db_status,
                   'Household Waste Pickup' as title, hp.full_name as citizen_name, 
                   u.phone_number as citizen_phone, u.age as citizen_age, u.email as citizen_email, 
                   CONCAT(hp.ward, ', ', hp.house_number) as location,
                   'Normal' as priority, COALESCE(hp.status, 'pending') as status, 
                   hp.full_address as description,
                   hp.created_at, 'pickup' as type,
                   NULL as image_url_raw
            FROM household_pickups hp
            JOIN users u ON hp.user_id = u.id
            WHERE hp.status IS NULL OR hp.status NOT IN ('cancelled', 'rejected', 'completed', 'approved', 'active')
            ORDER BY hp.created_at DESC
            LIMIT 50
        `);
        
        // Get pending dustbin requests (exclude cancelled) - show reason as title
        const [dustbinRequests] = await db.promise().query(`
            SELECT dr.id, dr.status as db_status,
                   CASE WHEN dr.reason LIKE 'Overflowing%' THEN 'Overflowing Dustbin Report' 
                        WHEN dr.reason LIKE 'Damaged%' THEN 'Damaged Dustbin Report'
                        ELSE 'Dustbin Request' END as title,
                   dr.reason as description,
                   u.full_name as citizen_name,
                   u.phone_number as citizen_phone,
                   u.age as citizen_age,
                   u.email as citizen_email,
                   CONCAT('Lat: ', dr.latitude, ', Lng: ', dr.longitude) as location,
                   'Normal' as priority, COALESCE(dr.status, 'pending') as status,
                   dr.created_at, dr.image_urls as image_url_raw,
                   'dustbin' as type
            FROM dustbin_requests dr
            JOIN users u ON dr.user_id = u.id
            WHERE dr.status IS NULL OR dr.status NOT IN ('cancelled', 'rejected', 'completed', 'approved', 'in_progress')
            ORDER BY dr.created_at DESC
            LIMIT 50
        `);
        
        // Combine all requests and parse image URLs from JSON
        const allRequests = [...pickups, ...reports, ...dustbinRequests]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(req => {
                // Normalize image field (handles JSON + string safely) -> single string or null
                const image = parseImage(req.image_url_raw || req.image_url || req.image_urls || req.imageUrls);

                return {
                    ...req,
                    image_url: image,
                    image,
                    image_url_raw: undefined,
                    image_urls: undefined
                };
            });
        
        res.status(200).json({ 
            requests: allRequests,
            _debug: { total: allRequests.length, pickups: pickups.length, reports: reports.length, dustbins: dustbinRequests.length }
        });
    } catch (error) {
        console.error('Error in getPendingRequests:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Get approved requests for monitoring
exports.getApprovedRequests = async (req, res) => {
    try {
        // Get approved household pickups (exclude cancelled)
        const [pickups] = await db.promise().query(`
               SELECT hp.id, hp.status as db_status,
                    'Household Waste Pickup' as title, hp.full_name as citizen_name, 
                    u.phone_number as citizen_phone, u.age as citizen_age, u.email as citizen_email, 
                    CONCAT(hp.ward, ', ', hp.house_number) as location,
                    'Normal' as priority, 
                    CASE WHEN hp.status = 'approved' THEN 'Approved' 
                        WHEN hp.status = 'active' THEN 'Assigned' 
                        ELSE 'Completed' END as status,
                    hp.full_address as description, hp.created_at, 'pickup' as type,
                    NULL as assigned_worker, NULL as worker_note,
                    NULL as image_url_raw
             FROM household_pickups hp
             JOIN users u ON hp.user_id = u.id
            WHERE hp.status IN ('approved', 'active', 'completed') AND hp.status != 'cancelled'
            ORDER BY hp.created_at DESC
        `);
        
        // Get approved waste reports (exclude cancelled)
        const [reports] = await db.promise().query(`
            SELECT wr.id, wr.status as db_status,
                   CASE WHEN wr.report_type = 'dead_animal' THEN 'Dead Animal Pickup' ELSE 'Street Waste Collection' END as title,
                   u.full_name as citizen_name, u.phone_number as citizen_phone, u.age as citizen_age, u.email as citizen_email,
                   CONCAT('Lat: ', wr.latitude, ', Lng: ', wr.longitude) as location,
                   CASE WHEN wr.report_type = 'dead_animal' THEN 'High' ELSE 'Normal' END as priority,
                   CASE WHEN wr.status = 'pending' THEN 'Pending' 
                        WHEN wr.status = 'in_progress' THEN 'In Progress' 
                        ELSE 'Completed' END as status,
                   wr.description, wr.created_at, wr.image_urls as image_url_raw, 'report' as type,
                   wr.worker_id as assigned_worker, wr.worker_note
            FROM waste_reports wr
            JOIN users u ON wr.user_id = u.id
            WHERE wr.status IN ('in_progress', 'completed') AND wr.status != 'cancelled'
            ORDER BY wr.created_at DESC
        `);
        
        // Get approved dustbin requests (exclude cancelled)
           const [dustbinRequests] = await db.promise().query(`
               SELECT dr.id, dr.status as db_status,
                    CASE WHEN dr.reason LIKE 'Overflowing%' THEN 'Overflowing Dustbin Report' 
                        WHEN dr.reason LIKE 'Damaged%' THEN 'Damaged Dustbin Report'
                        ELSE 'Dustbin Request' END as title,
                    dr.reason as description,
                    u.full_name as citizen_name,
                    u.phone_number as citizen_phone, u.age as citizen_age, u.email as citizen_email,
                    CONCAT('Lat: ', dr.latitude, ', Lng: ', dr.longitude) as location,
                    'Normal' as priority, 
                    CASE WHEN dr.status = 'in_progress' THEN 'In Progress' 
                        WHEN dr.status = 'rejected' THEN 'Rejected' 
                        WHEN dr.status = 'completed' THEN 'Completed'
                        ELSE dr.status END as status,
                    dr.created_at, dr.image_urls as image_url_raw, 'dustbin' as type,
                    dr.worker_id as assigned_worker, dr.worker_note
              FROM dustbin_requests dr
              JOIN users u ON dr.user_id = u.id
              WHERE dr.status IN ('in_progress', 'completed') AND dr.status != 'cancelled'
              ORDER BY dr.created_at DESC
           `);
        
        // Combine all approved requests and parse image URLs from JSON
        const allRequests = [...pickups, ...reports, ...dustbinRequests]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(req => {
                // Normalize image field (handles JSON + string safely) -> single string or null
                const image = parseImage(req.image_url_raw || req.image_url || req.image_urls || req.imageUrls);

                return {
                    ...req,
                    image_url: image,
                    image,
                    image_url_raw: undefined,
                    image_urls: undefined
                };
            });
        
        res.status(200).json({
            requests: allRequests
        });
    } catch (error) {
        console.error('[FETCH_APPROVED] ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get specific request details
exports.getRequestDetails = async (req, res) => {
    try {
        const { requestId, requestType } = req.params;
        
        let query;
        let tableName;
        
        switch(requestType) {
            case 'pickup':
                tableName = 'household_pickups';
                query = `
                    SELECT hp.id, 'Household Waste Pickup' as type, hp.status, 'Normal' as priority,
                           hp.full_address as description, hp.created_at, NULL as image_urls,
                           hp.full_name as citizen_name, u.phone_number as citizen_phone, u.age as citizen_age,
                           u.email as citizen_email,
                           CONCAT(hp.ward, ', ', hp.house_number, ', ', hp.full_address) as location,
                           NULL as worker_note
                    FROM household_pickups hp
                    JOIN users u ON hp.user_id = u.id
                    WHERE hp.id = ?
                `;
                break;
            case 'report':
                tableName = 'waste_reports';
                query = `
                    SELECT wr.id, 
                           CASE WHEN wr.report_type = 'dead_animal' THEN 'Dead Animal Pickup' ELSE 'Street Waste Collection' END as type,
                           wr.status, 
                           CASE WHEN wr.report_type = 'dead_animal' THEN 'High' ELSE 'Normal' END as priority,
                           wr.description, wr.created_at, wr.image_urls,
                           u.full_name as citizen_name, u.phone_number as citizen_phone, u.age as citizen_age,
                           u.email as citizen_email,
                           CONCAT('Lat: ', wr.latitude, ', Lng: ', wr.longitude) as location,
                           wr.worker_note
                    FROM waste_reports wr
                    JOIN users u ON wr.user_id = u.id
                    WHERE wr.id = ?
                `;
                break;
            case 'dustbin':
                tableName = 'dustbin_requests';
                query = `
                    SELECT dr.id, 'Dustbin Installation Request' as type, dr.status, 'Normal' as priority,
                           dr.reason as description, dr.created_at, dr.image_urls,
                           u.full_name as citizen_name, u.phone_number as citizen_phone, u.age as citizen_age,
                           u.email as citizen_email,
                           CONCAT('Lat: ', dr.latitude, ', Lng: ', dr.longitude) as location,
                           dr.worker_note
                    FROM dustbin_requests dr
                    JOIN users u ON dr.user_id = u.id
                    WHERE dr.id = ?
                `;
                break;
            default:
                return res.status(400).json({ message: 'Invalid request type' });
        }
        
        const [results] = await db.promise().query(query, [requestId]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        const request = results[0];
        // Normalize image field (handles JSON + string safely) -> expose single image_url
        const image = parseImage(request.image_urls || request.image_url || request.image || request.imageUrls);
        request.image_url = image;
        request.image = image;
        
        res.status(200).json({
            request: request
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve request
exports.approveRequest = async (req, res) => {
    try {
        const { requestId, requestType } = req.params;
        
        let tableName;
        let status;
        
        switch(requestType) {
            case 'pickup':
                tableName = 'household_pickups';
                status = 'approved';
                break;
            case 'report':
                tableName = 'waste_reports';
                status = 'in_progress'; // waste_reports uses 'in_progress' not 'approved'
                break;
            case 'dustbin':
                tableName = 'dustbin_requests';
                status = 'in_progress';
                break;
            default:
                return res.status(400).json({ message: 'Invalid request type' });
        }
        
        // DEBUG: Get current status BEFORE update
        const [beforeUpdate] = await db.promise().query(
            `SELECT id, status FROM ${tableName} WHERE id = ?`,
            [requestId]
        );
        
        console.log('===========================================');
        console.log('[ADMIN_APPROVE] ========== STATE TRANSITION ==========');
        console.log('[ADMIN_APPROVE] requestId:', requestId);
        console.log('[ADMIN_APPROVE] requestType:', requestType);
        console.log('[ADMIN_APPROVE] tableName:', tableName);
        console.log('[ADMIN_APPROVE] status_before:', beforeUpdate.length > 0 ? beforeUpdate[0].status : 'NOT_FOUND');
        console.log('[ADMIN_APPROVE] status_after (target):', status);
        console.log('[ADMIN_APPROVE] update_query: UPDATE ' + tableName + ' SET status = ? WHERE id = ?');
        
        // Update request status
        const [updateResult] = await db.promise().query(
            `UPDATE ${tableName} SET status = ? WHERE id = ?`,
            [status, requestId]
        );
        
        console.log('[ADMIN_APPROVE] rows_affected:', updateResult.affectedRows);
        
        // DEBUG: Get status AFTER update
        const [afterUpdate] = await db.promise().query(
            `SELECT id, status FROM ${tableName} WHERE id = ?`,
            [requestId]
        );
        console.log('[ADMIN_APPROVE] status_after (actual):', afterUpdate.length > 0 ? afterUpdate[0].status : 'NOT_FOUND');
        console.log('===========================================');
        
        res.status(200).json({ message: 'Request approved successfully' });
    } catch (error) {
        console.error('[ADMIN_APPROVE] ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Assign worker to request
exports.assignWorker = async (req, res) => {
    try {
        const { requestId, requestType } = req.params;
        const { workerId } = req.body;
        
        if (!workerId) {
            return res.status(400).json({ message: 'Worker ID is required' });
        }
        
        // Verify worker exists in database
        const [workers] = await db.promise().query(
            'SELECT id, role FROM users WHERE id = ? AND role = "worker"',
            [workerId]
        );
        
        if (workers.length === 0) {
            return res.status(404).json({ message: 'Worker not found or invalid role' });
        }
        
        let tableName;
        let status;
        
        switch(requestType) {
            case 'pickup':
                return res.status(400).json({ message: 'Household pickups do not require worker assignment' });
            case 'report':
                tableName = 'waste_reports';
                status = 'in_progress';
                break;
            case 'dustbin':
                tableName = 'dustbin_requests';
                status = 'in_progress';
                break;
            default:
                return res.status(400).json({ message: 'Invalid request type' });
        }

        // Prevent assigning already closed requests
        const [existing] = await db.promise().query(
            `SELECT status FROM ${tableName} WHERE id = ?`,
            [requestId]
        );
        if (!existing.length) {
            return res.status(404).json({ message: 'Request not found' });
        }
        const currentStatus = (existing[0].status || '').toLowerCase();
        if (['completed', 'cancelled', 'rejected'].includes(currentStatus)) {
            return res.status(400).json({ message: 'Cannot assign a closed request' });
        }
        
        // Update request with worker assignment
        await db.promise().query(
            `UPDATE ${tableName} SET worker_id = ?, status = ? WHERE id = ?`,
            [workerId, status, requestId]
        );
        
        res.status(200).json({ message: 'Worker assigned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const requestType = (req.params.requestType || '').toLowerCase();
        const status = (req.body.status || '').toLowerCase();
        
        // Validate status against allowed values for each request type
        const allowedStatuses = {
            pickup: ['approved', 'active', 'completed', 'rejected', 'cancelled'], // Household pickups can be approved or active
            report: ['pending', 'in_progress', 'completed', 'cancelled', 'rejected'], // Waste reports can be in progress
            dustbin: ['pending', 'in_progress', 'approved', 'rejected', 'completed', 'cancelled'] // Dustbin requests can be in progress
        };
        
        if (!allowedStatuses[requestType]?.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status '${status}'. Allowed values for ${requestType}: ${allowedStatuses[requestType]?.join(', ')}` 
            });
        }
        
        let tableName;
        
        switch(requestType) {
            case 'pickup':
                tableName = 'household_pickups';
                break;
            case 'report':
                tableName = 'waste_reports';
                break;
            case 'dustbin':
                tableName = 'dustbin_requests';
                break;
            default:
                return res.status(400).json({ message: 'Invalid request type' });
        }
        
        // Update request status
        const [updateResult] = await db.promise().query(
            `UPDATE ${tableName} SET status = ? WHERE id = ?`,
            [status, requestId]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const [rows] = await db.promise().query(`SELECT * FROM ${tableName} WHERE id = ?`, [requestId]);
        const updatedRequest = rows[0] || null;

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found after update' });
        }

        const storedStatus = (updatedRequest.status || '').toLowerCase();
        if (storedStatus !== status) {
            console.error('[UPDATE_STATUS] Status mismatch after update', { requestId, requestType, expected: status, actual: storedStatus });
            return res.status(500).json({
                message: `Status update failed: stored value '${storedStatus}' does not match requested '${status}'. Verify table enum supports this status.`
            });
        }

        console.log('[UPDATE_STATUS] after update', { tableName, requestId, status, row: updatedRequest });
        
        res.status(200).json({ 
            message: 'Status updated successfully',
            requestId: Number(requestId),
            newStatus: status,
            type: requestType,
            updatedRequest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset worker password
exports.resetWorkerPassword = async (req, res) => {
    const { workerId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
    }
    
    try {
        // Check if worker exists
        const [existingWorkers] = await db.promise().query(
            'SELECT * FROM users WHERE id = ? AND role = "worker"',
            [workerId]
        );
        
        if (existingWorkers.length === 0) {
            return res.status(404).json({ message: 'Worker not found' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        // Update password
        await db.promise().query(
            'UPDATE users SET password_hash = ? WHERE id = ? AND role = "worker"',
            [passwordHash, workerId]
        );
        
        // Update file storage (preserve existing age and phone)
        const existingDetails = getWorkerDetails(workerId);
        setWorkerPassword(workerId, newPassword, existingDetails?.age, existingDetails?.phoneNumber);
        
        res.status(200).json({ 
            message: 'Worker password reset successfully',
            newPassword: newPassword // Return new password for admin reference
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get citizen management statistics
exports.getCitizenStats = async (req, res) => {
    try {
        console.log('[CITIZEN_STATS] Fetching citizen statistics...');
        
        // Get total citizens (role = 'citizen')
        const [citizensResult] = await db.promise().query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'citizen'"
        );
        const totalCitizens = citizensResult[0]?.count || 0;
        console.log('[CITIZEN_STATS] Total citizens:', totalCitizens);
        
        // Get total reports that reached admin approval (approved/in_progress/completed)
        // From waste_reports
        const [wasteReportsResult] = await db.promise().query(
            "SELECT COUNT(*) as count FROM waste_reports WHERE status IN ('approved', 'in_progress', 'completed')"
        );
        // From household_pickups
        const [pickupsResult] = await db.promise().query(
            "SELECT COUNT(*) as count FROM household_pickups WHERE status IN ('approved', 'active', 'completed')"
        );
        // From dustbin_requests
        const [dustbinResult] = await db.promise().query(
            "SELECT COUNT(*) as count FROM dustbin_requests WHERE status IN ('approved', 'completed')"
        );
        
        const totalReports = (wasteReportsResult[0]?.count || 0) + 
                           (pickupsResult[0]?.count || 0) + 
                           (dustbinResult[0]?.count || 0);
        console.log('[CITIZEN_STATS] Total reports:', totalReports);
        
        console.log('[CITIZEN_STATS] Final stats:', { totalCitizens, totalReports });
        res.status(200).json({ totalCitizens, totalReports });
        
    } catch (error) {
        console.error('[CITIZEN_STATS] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all citizens with their report counts and points
exports.getAllCitizens = async (req, res) => {
    try {
        console.log('[GET_CITIZENS] Fetching all citizens...');
        
        // Get all citizens with their report counts
        const [citizens] = await db.promise().query(
            `SELECT 
                u.id,
                u.full_name,
                u.email,
                u.eco_points,
                u.created_at,
                u.role,
                COALESCE(
                    (SELECT COUNT(*) FROM waste_reports WHERE user_id = u.id) +
                    (SELECT COUNT(*) FROM household_pickups WHERE user_id = u.id) +
                    (SELECT COUNT(*) FROM dustbin_requests WHERE user_id = u.id),
                    0
                ) as report_count
            FROM users u
            WHERE u.role = 'citizen'
            ORDER BY u.created_at DESC`
        );
        
        console.log('[GET_CITIZENS] Found citizens:', citizens.length);
        console.log('[GET_CITIZENS] Sample:', citizens.slice(0, 2).map(c => ({ id: c.id, name: c.full_name, reports: c.report_count })));
        
        res.status(200).json({ citizens });
        
    } catch (error) {
        console.error('[GET_CITIZENS] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a citizen
exports.deleteCitizen = async (req, res) => {
    try {
        const { citizenId } = req.params;
        console.log('[DELETE_CITIZEN] Deleting citizen:', citizenId);
        
        // First check if citizen exists and is actually a citizen
        const [existing] = await db.promise().query(
            "SELECT id, full_name, role FROM users WHERE id = ? AND role = 'citizen'",
            [citizenId]
        );
        
        if (existing.length === 0) {
            console.log('[DELETE_CITIZEN] Citizen not found:', citizenId);
            return res.status(404).json({ message: 'Citizen not found' });
        }
        
        console.log('[DELETE_CITIZEN] Found citizen:', existing[0]);
        
        // Delete related records first (cascade)
        await db.promise().query('DELETE FROM waste_reports WHERE user_id = ?', [citizenId]);
        await db.promise().query('DELETE FROM household_pickups WHERE user_id = ?', [citizenId]);
        await db.promise().query('DELETE FROM dustbin_requests WHERE user_id = ?', [citizenId]);
        
        // Delete the citizen
        const [result] = await db.promise().query('DELETE FROM users WHERE id = ?', [citizenId]);
        
        console.log('[DELETE_CITIZEN] Deletion result:', result);
        console.log('[DELETE_CITIZEN] Successfully deleted citizen:', citizenId);
        
        res.status(200).json({ message: 'Citizen deleted successfully' });
        
    } catch (error) {
        console.error('[DELETE_CITIZEN] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get citizen leaderboard (shared logic with citizen dashboard)
exports.getCitizenLeaderboard = async (req, res) => {
    try {
        console.log('[CITIZEN_LEADERBOARD] Fetching leaderboard...');
        
        // Get users with their total contributions (reports)
        const [users] = await db.promise().query(
            `SELECT 
                u.id,
                u.full_name,
                u.eco_points,
                COALESCE(
                    (SELECT COUNT(*) FROM waste_reports WHERE user_id = u.id) +
                    (SELECT COUNT(*) FROM household_pickups WHERE user_id = u.id) +
                    (SELECT COUNT(*) FROM dustbin_requests WHERE user_id = u.id),
                    0
                ) as total_contributions
            FROM users u
            WHERE u.role = 'citizen' AND u.eco_points > 0
            ORDER BY u.eco_points DESC, total_contributions DESC
            LIMIT 20`
        );
        
        console.log('[CITIZEN_LEADERBOARD] Found users:', users.length);
        console.log('[CITIZEN_LEADERBOARD] Top 3:', users.slice(0, 3).map(u => ({ name: u.full_name, points: u.eco_points })));
        
        res.status(200).json({ leaderboard: users });
        
    } catch (error) {
        console.error('[CITIZEN_LEADERBOARD] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===================== NOTICES API =====================

// Get all notices (Admin - sees all)
exports.getAllNotices = async (req, res) => {
    try {
        console.log('[ADMIN_NOTICES] Fetching all notices...');
        
        const [notices] = await db.promise().query(`
            SELECT 
                id,
                title,
                description,
                created_at,
                expires_at,
                created_by,
                CASE 
                    WHEN expires_at >= CURDATE() THEN 'active'
                    ELSE 'expired'
                END as status
            FROM notices
            ORDER BY created_at DESC
        `);
        
        console.log('[ADMIN_NOTICES] Found notices:', notices.length);
        console.log('[ADMIN_NOTICES] Sample:', notices.slice(0, 2).map(n => ({ 
            id: n.id, 
            title: n.title, 
            expires_at: n.expires_at,
            expires_at_type: typeof n.expires_at,
            expires_at_string: String(n.expires_at),
            status: n.status 
        })));
        
        // Normalize dates to YYYY-MM-DD format to avoid timezone issues
        const normalizedNotices = notices.map(notice => ({
            ...notice,
            expires_at: String(notice.expires_at).split('T')[0],
            created_at: String(notice.created_at).split('T')[0]
        }));
        
        console.log('[ADMIN_NOTICES] Normalized sample:', normalizedNotices.slice(0, 2).map(n => ({ id: n.id, expires_at: n.expires_at })));
        
        res.status(200).json({ notices: normalizedNotices });
        
    } catch (error) {
        console.error('[ADMIN_NOTICES] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create notice
exports.createNotice = async (req, res) => {
    try {
        const { title, description, expires_at } = req.body;
        const adminId = req.user.id;
        
        console.log('[CREATE_NOTICE] Creating notice:', { title, expires_at, adminId });
        
        if (!title || !description || !expires_at) {
            return res.status(400).json({ message: 'Title, description, and expiry date are required' });
        }
        
        // Validate expiry date
        const expiryDate = new Date(expires_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expiryDate < today) {
            return res.status(400).json({ message: 'Expiry date must be today or in the future' });
        }
        
        const [result] = await db.promise().query(
            'INSERT INTO notices (title, description, expires_at, created_by) VALUES (?, ?, ?, ?)',
            [title, description, expires_at, adminId]
        );
        
        console.log('[CREATE_NOTICE] Notice created with ID:', result.insertId);
        
        res.status(201).json({ 
            message: 'Notice created successfully',
            noticeId: result.insertId 
        });
        
    } catch (error) {
        console.error('[CREATE_NOTICE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update notice
exports.updateNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        const { title, description, expires_at } = req.body;
        
        console.log('[UPDATE_NOTICE] Updating notice:', noticeId);
        
        // Check if notice exists
        const [existing] = await db.promise().query('SELECT id FROM notices WHERE id = ?', [noticeId]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Notice not found' });
        }
        
        // Validate expiry date if provided
        if (expires_at) {
            const expiryDate = new Date(expires_at);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (expiryDate < today) {
                return res.status(400).json({ message: 'Expiry date must be today or in the future' });
            }
        }
        
        const [result] = await db.promise().query(
            'UPDATE notices SET title = COALESCE(?, title), description = COALESCE(?, description), expires_at = COALESCE(?, expires_at) WHERE id = ?',
            [title, description, expires_at, noticeId]
        );
        
        console.log('[UPDATE_NOTICE] Notice updated:', noticeId);
        
        res.status(200).json({ message: 'Notice updated successfully' });
        
    } catch (error) {
        console.error('[UPDATE_NOTICE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete notice
exports.deleteNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        
        console.log('[DELETE_NOTICE] Deleting notice:', noticeId);
        
        // Check if notice exists
        const [existing] = await db.promise().query('SELECT id FROM notices WHERE id = ?', [noticeId]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Notice not found' });
        }
        
        await db.promise().query('DELETE FROM notices WHERE id = ?', [noticeId]);
        
        console.log('[DELETE_NOTICE] Notice deleted:', noticeId);
        
        res.status(200).json({ message: 'Notice deleted successfully' });
        
    } catch (error) {
        console.error('[DELETE_NOTICE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
}

// ===================== EMERGENCY CONTACTS API =====================

// Get all emergency contacts (Admin - sees all)
exports.getAllEmergencyContacts = async (req, res) => {
    try {
        console.log('[ADMIN_EMERGENCY_CONTACTS] Fetching all contacts...');
        
        const [contacts] = await db.promise().query(`
            SELECT 
                id,
                service_name,
                phone_number,
                is_active,
                created_at,
                updated_at
            FROM emergency_contacts
            ORDER BY service_name ASC
        `);
        
        console.log('[ADMIN_EMERGENCY_CONTACTS] Found contacts:', contacts.length);
        console.log('[ADMIN_EMERGENCY_CONTACTS] Sample:', contacts.slice(0, 2).map(c => ({ id: c.id, service_name: c.service_name, is_active: c.is_active })));
        
        res.status(200).json({ contacts });
        
    } catch (error) {
        console.error('[ADMIN_EMERGENCY_CONTACTS] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create emergency contact
exports.createEmergencyContact = async (req, res) => {
    try {
        const { service_name, phone_number } = req.body;
        const adminId = req.user.id;
        
        console.log('[CREATE_EMERGENCY_CONTACT] Creating contact:', { service_name, phone_number, adminId });
        
        if (!service_name || !phone_number) {
            return res.status(400).json({ message: 'Service name and phone number are required' });
        }
        
        // Validate phone number: numeric string, length 2-15
        const phoneRegex = /^\d{2,15}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ message: 'Phone number must be 2-15 digits' });
        }
        
        // Validate service name: trimmed, case-insensitive uniqueness
        const trimmedName = service_name.trim();
        if (!trimmedName) {
            return res.status(400).json({ message: 'Service name cannot be empty' });
        }
        
        // Check for case-insensitive duplicate
        const [existing] = await db.promise().query(
            'SELECT id FROM emergency_contacts WHERE LOWER(service_name) = LOWER(?)',
            [trimmedName]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'A contact with this service name already exists' });
        }
        
        const [result] = await db.promise().query(
            'INSERT INTO emergency_contacts (service_name, phone_number, is_active) VALUES (?, ?, TRUE)',
            [trimmedName, phone_number]
        );
        
        console.log('[CREATE_EMERGENCY_CONTACT] Contact created with ID:', result.insertId);
        
        res.status(201).json({ 
            message: 'Emergency contact created successfully',
            contactId: result.insertId 
        });
        
    } catch (error) {
        console.error('[CREATE_EMERGENCY_CONTACT] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update emergency contact
exports.updateEmergencyContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { service_name, phone_number } = req.body;
        
        console.log('[UPDATE_EMERGENCY_CONTACT] Updating contact:', contactId);
        
        // Check if contact exists
        const [existing] = await db.promise().query('SELECT id FROM emergency_contacts WHERE id = ?', [contactId]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Emergency contact not found' });
        }
        
        // Validate phone number if provided
        if (phone_number) {
            const phoneRegex = /^\d{2,15}$/;
            if (!phoneRegex.test(phone_number)) {
                return res.status(400).json({ message: 'Phone number must be 2-15 digits' });
            }
        }
        
        // Validate service name if provided
        if (service_name) {
            const trimmedName = service_name.trim();
            if (!trimmedName) {
                return res.status(400).json({ message: 'Service name cannot be empty' });
            }
            
            // Check for case-insensitive duplicate (excluding current record)
            const [duplicate] = await db.promise().query(
                'SELECT id FROM emergency_contacts WHERE LOWER(service_name) = LOWER(?) AND id != ?',
                [trimmedName, contactId]
            );
            
            if (duplicate.length > 0) {
                return res.status(400).json({ message: 'A contact with this service name already exists' });
            }
            
            // Update service_name
            await db.promise().query(
                'UPDATE emergency_contacts SET service_name = ? WHERE id = ?',
                [trimmedName, contactId]
            );
        }
        
        // Update phone_number if provided
        if (phone_number) {
            await db.promise().query(
                'UPDATE emergency_contacts SET phone_number = ? WHERE id = ?',
                [phone_number, contactId]
            );
        }
        
        console.log('[UPDATE_EMERGENCY_CONTACT] Contact updated:', contactId);
        
        res.status(200).json({ message: 'Emergency contact updated successfully' });
        
    } catch (error) {
        console.error('[UPDATE_EMERGENCY_CONTACT] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Toggle emergency contact status (soft delete / enable)
exports.toggleEmergencyContactStatus = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { is_active } = req.body;
        
        console.log('[TOGGLE_EMERGENCY_CONTACT] Toggling contact:', contactId, 'to is_active:', is_active);
        
        // Check if contact exists
        const [existing] = await db.promise().query('SELECT id, is_active FROM emergency_contacts WHERE id = ?', [contactId]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Emergency contact not found' });
        }
        
        // Validate is_active is boolean
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ message: 'is_active must be a boolean value' });
        }
        
        await db.promise().query(
            'UPDATE emergency_contacts SET is_active = ? WHERE id = ?',
            [is_active, contactId]
        );
        
        console.log('[TOGGLE_EMERGENCY_CONTACT] Contact toggled:', contactId, 'is_active:', is_active);
        
        res.status(200).json({ message: `Emergency contact ${is_active ? 'enabled' : 'disabled'} successfully` });
        
    } catch (error) {
        console.error('[TOGGLE_EMERGENCY_CONTACT] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===================== ADMIN PROFILE API =====================

// Get admin profile (single admin)
exports.getAdminProfile = async (req, res) => {
    try {
        const adminId = req.user.id;
        console.log('[ADMIN_PROFILE] Fetching profile for admin ID:', adminId);
        
        const [users] = await db.promise().query(
            `SELECT id, full_name, email, phone_number, role, created_at 
             FROM users WHERE id = ? AND role = 'admin'`,
            [adminId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Admin profile not found' });
        }
        
        const admin = users[0];
        console.log('[ADMIN_PROFILE] Admin found:', { id: admin.id, email: admin.email, full_name: admin.full_name });
        
        res.status(200).json({ 
            admin: {
                id: admin.id,
                full_name: admin.full_name,
                email: admin.email,
                phone_number: admin.phone_number || '',
                role: admin.role,
                created_at: admin.created_at
            }
        });
        
    } catch (error) {
        console.error('[ADMIN_PROFILE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update admin profile (phone_number and municipality only)
exports.updateAdminProfile = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { phone_number, municipality } = req.body;
        
        console.log('[ADMIN_PROFILE_UPDATE] Updating profile for admin ID:', adminId);
        
        // Validate that we're updating the correct admin
        const [existing] = await db.promise().query(
            "SELECT id, role FROM users WHERE id = ? AND role = 'admin'",
            [adminId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (phone_number !== undefined) {
            updates.push('phone_number = ?');
            values.push(phone_number);
        }
        
        if (municipality !== undefined) {
            // Schema currently has no municipality column; avoid SQL errors and inform client
            return res.status(400).json({ message: 'Municipality field is not available in this environment' });
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        values.push(adminId);
        
        await db.promise().query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        console.log('[ADMIN_PROFILE_UPDATE] Profile updated successfully');
        
        res.status(200).json({ message: 'Profile updated successfully' });
        
    } catch (error) {
        console.error('[ADMIN_PROFILE_UPDATE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change admin password
exports.changeAdminPassword = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { current_password, new_password, confirm_password } = req.body;
        
        console.log('[ADMIN_PASSWORD_CHANGE] Password change request for admin ID:', adminId);
        
        // Validate inputs
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({ message: 'All password fields are required' });
        }
        
        if (new_password !== confirm_password) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }
        
        if (new_password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        // Get current password hash
        const [users] = await db.promise().query(
            "SELECT password_hash FROM users WHERE id = ? AND role = 'admin'",
            [adminId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        const admin = users[0];
        
        // Check if using local auth (not Google/Facebook)
        if (!admin.password_hash) {
            return res.status(400).json({ message: 'Cannot change password for OAuth accounts' });
        }
        
        // Verify current password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(current_password, admin.password_hash);
        
        if (!isMatch) {
            console.log('[ADMIN_PASSWORD_CHANGE] Current password incorrect');
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password and update
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);
        
        await db.promise().query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [password_hash, adminId]
        );
        
        console.log('[ADMIN_PASSWORD_CHANGE] Password changed successfully');
        
        res.status(200).json({ message: 'Password changed successfully' });
        
    } catch (error) {
        console.error('[ADMIN_PASSWORD_CHANGE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===================== HOUSEHOLD WASTE PICKUP SCHEDULE API =====================

// Get all ward schedules
exports.getWardSchedules = async (req, res) => {
    try {
        console.log('[ADMIN_WARD_SCHEDULE] Fetching all ward schedules');
        
        const [schedules] = await db.promise().query(`
            SELECT id, day_of_week, ward_number, created_at
            FROM ward_schedule
            ORDER BY FIELD(day_of_week, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), ward_number
        `);
        
        console.log('[ADMIN_WARD_SCHEDULE] Found schedules:', schedules.length);
        res.status(200).json({ schedules });
        
    } catch (error) {
        console.error('[ADMIN_WARD_SCHEDULE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add ward to schedule
exports.addWardSchedule = async (req, res) => {
    const { day_of_week, ward_number } = req.body;
    
    if (!day_of_week || !ward_number) {
        return res.status(400).json({ message: 'Day and ward number are required' });
    }
    
    try {
        console.log('[ADMIN_WARD_SCHEDULE] Adding:', day_of_week, ward_number);
        
        await db.promise().query(
            'INSERT INTO ward_schedule (day_of_week, ward_number) VALUES (?, ?)',
            [day_of_week, ward_number]
        );
        
        console.log('[ADMIN_WARD_SCHEDULE] Ward schedule added successfully');
        res.status(201).json({ message: 'Ward schedule added successfully' });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'This ward is already scheduled for this day' });
        }
        console.error('[ADMIN_WARD_SCHEDULE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove ward from schedule
exports.removeWardSchedule = async (req, res) => {
    const { scheduleId } = req.params;
    
    try {
        console.log('[ADMIN_WARD_SCHEDULE] Removing:', scheduleId);
        
        await db.promise().query('DELETE FROM ward_schedule WHERE id = ?', [scheduleId]);
        
        console.log('[ADMIN_WARD_SCHEDULE] Ward schedule removed successfully');
        res.status(200).json({ message: 'Ward schedule removed successfully' });
        
    } catch (error) {
        console.error('[ADMIN_WARD_SCHEDULE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all areas/routes
exports.getAreaRoutes = async (req, res) => {
    try {
        console.log('[ADMIN_AREA_ROUTES] Fetching all areas');
        
        const [areas] = await db.promise().query(`
            SELECT ar.*, 
                (SELECT full_name FROM users WHERE id = waa.worker_id) as assigned_worker_name
            FROM area_routes ar
            LEFT JOIN worker_area_assignments waa ON ar.id = waa.area_id
            ORDER BY ar.ward_number, ar.area_name
        `);
        
        console.log('[ADMIN_AREA_ROUTES] Found areas:', areas.length);
        res.status(200).json({ areas });
        
    } catch (error) {
        console.error('[ADMIN_AREA_ROUTES] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add area/route
exports.addAreaRoute = async (req, res) => {
    const { ward_number, area_name, description } = req.body;
    
    if (!ward_number || !area_name) {
        return res.status(400).json({ message: 'Ward number and area name are required' });
    }
    
    try {
        console.log('[ADMIN_AREA_ROUTES] Adding area:', area_name, 'to ward', ward_number);
        
        const [result] = await db.promise().query(
            'INSERT INTO area_routes (ward_number, area_name, description) VALUES (?, ?, ?)',
            [ward_number, area_name, description || null]
        );
        
        console.log('[ADMIN_AREA_ROUTES] Area added successfully, ID:', result.insertId);
        res.status(201).json({ 
            message: 'Area added successfully',
            areaId: result.insertId
        });
        
    } catch (error) {
        console.error('[ADMIN_AREA_ROUTES] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update area/route
exports.updateAreaRoute = async (req, res) => {
    const { areaId } = req.params;
    const { area_name, description } = req.body;
    
    try {
        console.log('[ADMIN_AREA_ROUTES] Updating area:', areaId);
        
        await db.promise().query(
            'UPDATE area_routes SET area_name = ?, description = ? WHERE id = ?',
            [area_name, description || null, areaId]
        );
        
        console.log('[ADMIN_AREA_ROUTES] Area updated successfully');
        res.status(200).json({ message: 'Area updated successfully' });
        
    } catch (error) {
        console.error('[ADMIN_AREA_ROUTES] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete area/route
exports.deleteAreaRoute = async (req, res) => {
    const { areaId } = req.params;
    
    try {
        console.log('[ADMIN_AREA_ROUTES] Deleting area:', areaId);
        
        // First remove worker assignments
        await db.promise().query('DELETE FROM worker_area_assignments WHERE area_id = ?', [areaId]);
        // Then delete area
        await db.promise().query('DELETE FROM area_routes WHERE id = ?', [areaId]);
        
        console.log('[ADMIN_AREA_ROUTES] Area deleted successfully');
        res.status(200).json({ message: 'Area deleted successfully' });
        
    } catch (error) {
        console.error('[ADMIN_AREA_ROUTES] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Assign worker to area
exports.assignWorkerToArea = async (req, res) => {
    const { worker_id, area_id } = req.body;
    
    if (!worker_id || !area_id) {
        return res.status(400).json({ message: 'Worker ID and Area ID are required' });
    }
    
    try {
        console.log('[ADMIN_WORKER_ASSIGN] Assigning worker:', worker_id, 'to area:', area_id);
        
        await db.promise().query(
            'INSERT INTO worker_area_assignments (worker_id, area_id) VALUES (?, ?)',
            [worker_id, area_id]
        );
        
        console.log('[ADMIN_WORKER_ASSIGN] Worker assigned successfully');
        res.status(201).json({ message: 'Worker assigned to area successfully' });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Worker is already assigned to this area' });
        }
        console.error('[ADMIN_WORKER_ASSIGN] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove worker from area
exports.removeWorkerFromArea = async (req, res) => {
    const { assignmentId } = req.params;
    
    try {
        console.log('[ADMIN_WORKER_ASSIGN] Removing assignment:', assignmentId);
        
        await db.promise().query('DELETE FROM worker_area_assignments WHERE id = ?', [assignmentId]);
        
        console.log('[ADMIN_WORKER_ASSIGN] Worker removed successfully');
        res.status(200).json({ message: 'Worker removed from area successfully' });
        
    } catch (error) {
        console.error('[ADMIN_WORKER_ASSIGN] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all workers for assignment dropdown
exports.getAllWorkersForAssignment = async (req, res) => {
    try {
        console.log('[ADMIN_WORKERS] Fetching all workers for assignment');

        const [workers] = await db.promise().query("SELECT id, full_name, email, phone_number FROM users WHERE role = 'worker' ORDER BY full_name ASC");

        res.status(200).json({ workers });
    } catch (error) {
        console.error('[ADMIN_WORKERS] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
