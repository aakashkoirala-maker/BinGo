const db = require('../config/db');

// Register Household Pickup
exports.registerPickup = async (req, res) => {
    const { fullName, phone, ward, houseNumber, fullAddress, latitude, longitude } = req.body;
    const userId = req.user.id;

    console.log('[REGISTER_PICKUP] Received body:', req.body);

    if (!fullName || !phone || !ward || !houseNumber || !fullAddress) {
        return res.status(400).json({ message: 'All mandatory fields are required' });
    }

    try {
        // Check if user already registered for THIS house number? (Optional based on rules)
        // Rule: One user can register one pickup per house number (excluding cancelled requests).
        const [existing] = await db.promise().query(
            'SELECT * FROM household_pickups WHERE user_id = ? AND house_number = ? AND status != "cancelled"',
            [userId, houseNumber]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'You have already registered a pickup for this house number.' });
        }

        const [result] = await db.promise().query(
            'INSERT INTO household_pickups (user_id, full_name, phone, ward, house_number, full_address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, fullName, phone, ward, houseNumber, fullAddress, latitude, longitude]
        );

        const [row] = await db.promise().query('SELECT id, status, full_name, full_address FROM household_pickups WHERE id = ?', [result.insertId]);
        console.log('[REGISTER_PICKUP] DB row inserted:', row[0]);

        const responsePayload = { message: 'Household pickup registered successfully!', id: result.insertId, pointsEarned: 0 };
        console.log('[REGISTER_PICKUP] RESPONSE:', responsePayload);
        res.status(201).json(responsePayload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Safety limit for base64 payload to avoid max_allowed_packet disconnects
const MAX_IMAGE_PAYLOAD_CHARS = 10 * 1024 * 1024; // ~10MB of base64 text (~7.5MB binary)

const normalizeImages = (imageUrls) => {
    if (!imageUrls) return [];
    if (Array.isArray(imageUrls)) return imageUrls.filter(Boolean);
    return imageUrls ? [imageUrls] : [];
};

const isPayloadTooLarge = (imagesArray) => {
    const totalChars = imagesArray.reduce((sum, img) => sum + (typeof img === 'string' ? img.length : 0), 0);
    return totalChars > MAX_IMAGE_PAYLOAD_CHARS;
};

// Report Waste (Street or Dead Animal)
exports.reportWaste = async (req, res) => {
    const { reportType, wasteType, description, latitude, longitude, imageUrls } = req.body;
    const userId = req.user.id;

    if (!description || !reportType) {
        return res.status(400).json({ message: 'Description and Report Type are required' });
    }

    try {
        const normalizedImages = normalizeImages(imageUrls);
        if (isPayloadTooLarge(normalizedImages)) {
            return res.status(413).json({ message: 'Image payload too large. Please upload smaller images.' });
        }

        const imageUrlString = normalizedImages.length > 0 ? JSON.stringify(normalizedImages) : null;

        const [result] = await db.promise().query(
            'INSERT INTO waste_reports (user_id, report_type, waste_type, description, latitude, longitude, image_urls) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, reportType, wasteType || null, description, latitude, longitude, imageUrlString]
        );

        const responsePayload = { message: 'Report submitted successfully!', id: result.insertId, pointsEarned: 0 };
        res.status(201).json(responsePayload);
    } catch (error) {
        console.error('[REPORT_WASTE] ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Request Dustbin
exports.requestDustbin = async (req, res) => {
    const { areaType, estimatedUsers, reason, latitude, longitude, imageUrls } = req.body;
    const userId = req.user.id;

    if (!areaType || !estimatedUsers || !reason) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if image_urls column exists
        const [columns] = await db.promise().query("SHOW COLUMNS FROM dustbin_requests LIKE 'image_urls'");

        let query, params;
        if (columns.length > 0) {
            const normalizedImages = normalizeImages(imageUrls);
            if (isPayloadTooLarge(normalizedImages)) {
                return res.status(413).json({ message: 'Image payload too large. Please upload smaller images.' });
            }

            const imageUrlString = normalizedImages.length > 0 ? JSON.stringify(normalizedImages) : null;
            query = 'INSERT INTO dustbin_requests (user_id, area_type, estimated_users, reason, latitude, longitude, image_urls) VALUES (?, ?, ?, ?, ?, ?, ?)';
            params = [userId, areaType, estimatedUsers, reason, latitude, longitude, imageUrlString];
        } else {
            // Column doesn't exist, exclude imageUrls
            query = 'INSERT INTO dustbin_requests (user_id, area_type, estimated_users, reason, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)';
            params = [userId, areaType, estimatedUsers, reason, latitude, longitude];
        }

        const [result] = await db.promise().query(query, params);
        const responsePayload = { message: 'Dustbin request submitted successfully!', id: result.insertId, pointsEarned: 0 };
        res.status(201).json(responsePayload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all user requests and reports
exports.getRequests = async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch household pickups (handle NULL status)
        const [pickups] = await db.promise().query(
            'SELECT id, "household_pickup" as req_type, "Household Pickup" as type, full_name as title, full_address as location, COALESCE(status, "pending") as status, created_at FROM household_pickups WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Fetch waste reports (handle NULL status)
        const [reports] = await db.promise().query(
            'SELECT id, CASE WHEN report_type = "dead_animal" THEN "dead_animal_report" ELSE "street_waste_report" END as req_type, CASE WHEN report_type = "dead_animal" THEN "Dead Animal Report" ELSE CONCAT(UPPER(report_type), " - ", waste_type) END as type, description as title, CONCAT("Lat: ", latitude, ", Lng: ", longitude) as location, COALESCE(status, "pending") as status, created_at FROM waste_reports WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Fetch dustbin requests (handle NULL status)
        // Distinguish between "Overflowing Dustbin Report" and "Dustbin Installation Request" based on reason field
        const [dustbinReqs] = await db.promise().query(
            `SELECT id, "dustbin_request" as req_type,
            CASE 
                WHEN reason LIKE 'Overflowing dustbin report:%' THEN 'Overflowing Dustbin Report'
                ELSE 'Dustbin Installation Request'
            END as type, 
            reason as title, 
            CONCAT("Location: ", IF(latitude IS NOT NULL, CONCAT("Lat: ", latitude, ", Lng: ", longitude), "Not specified")) as location, 
            COALESCE(status, "pending") as status, 
            created_at 
            FROM dustbin_requests WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        // Combine all requests
        const allRequests = [...pickups, ...reports, ...dustbinReqs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.status(200).json({
            requests: allRequests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Dashboard Stats
exports.getStats = async (req, res) => {
    const userId = req.user.id;

    try {
        // Treat NULL as pending for accurate citizen-facing counts
        const [pending] = await db.promise().query(`
            SELECT 
                (SELECT COUNT(*) FROM household_pickups WHERE user_id = ? AND COALESCE(status, 'pending') = 'pending') +
                (SELECT COUNT(*) FROM waste_reports WHERE user_id = ? AND COALESCE(status, 'pending') = 'pending') +
                (SELECT COUNT(*) FROM dustbin_requests WHERE user_id = ? AND COALESCE(status, 'pending') = 'pending') as count
        `, [userId, userId, userId]);

        const [completed] = await db.promise().query(`
            SELECT 
                (SELECT COUNT(*) FROM household_pickups WHERE user_id = ? AND status = 'active') +
                (SELECT COUNT(*) FROM waste_reports WHERE user_id = ? AND status = 'completed') +
                (SELECT COUNT(*) FROM dustbin_requests WHERE user_id = ? AND status = 'approved') as count
        `, [userId, userId, userId]);

        // Treat NULL as pending; exclude cancelled/rejected from totals
        const [total] = await db.promise().query(`
             SELECT 
            (SELECT COUNT(*) FROM household_pickups WHERE user_id = ? AND COALESCE(status, 'pending') NOT IN ('cancelled', 'rejected')) +
            (SELECT COUNT(*) FROM waste_reports WHERE user_id = ? AND COALESCE(status, 'pending') NOT IN ('cancelled', 'rejected')) +
            (SELECT COUNT(*) FROM dustbin_requests WHERE user_id = ? AND COALESCE(status, 'pending') NOT IN ('cancelled', 'rejected')) as count
        `, [userId, userId, userId]);

        res.status(200).json({
            pending: pending[0].count,
            completed: completed[0].count,
            total: total[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Leaderboard (top 20 citizens by eco-points)
exports.getLeaderboard = async (req, res) => {
    try {
        const [users] = await db.promise().query(
            `SELECT id, full_name, eco_points, 
            (SELECT COUNT(*) FROM waste_reports WHERE user_id = users.id) +
            (SELECT COUNT(*) FROM household_pickups WHERE user_id = users.id) +
            (SELECT COUNT(*) FROM dustbin_requests WHERE user_id = users.id) as total_contributions
            FROM users WHERE role = 'citizen' AND eco_points > 0 
            ORDER BY eco_points DESC LIMIT 20`
        );

        res.status(200).json({ leaderboard: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's own points
exports.getMyPoints = async (req, res) => {
    const userId = req.user.id;
    try {
        const [user] = await db.promise().query('SELECT eco_points FROM users WHERE id = ?', [userId]);
        const [rank] = await db.promise().query(
            'SELECT COUNT(*) + 1 as rank FROM users WHERE eco_points > (SELECT eco_points FROM users WHERE id = ?)',
            [userId]
        );

        res.status(200).json({
            points: user[0]?.eco_points || 0,
            rank: rank[0]?.rank || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Award points when request is completed (to be called by worker/admin)
exports.awardPointsForCompletion = async (userId, requestType, requestId) => {
    try {
        let points = 0;
        
        // Determine points based on request type
        switch (requestType) {
            case 'household_pickup':
                points = 5;
                break;
            case 'street_waste':
                points = 10;
                break;
            case 'dead_animal':
                points = 12;
                break;
            case 'dustbin_request':
                points = 15;
                break;
            default:
                points = 5;
        }
        
        // Award points to user
        await db.promise().query('UPDATE users SET eco_points = eco_points + ? WHERE id = ?', [points, userId]);
        
        console.log(`Awarded ${points} points to user ${userId} for ${requestType} completion`);
        return points;
    } catch (error) {
        console.error('Error awarding points:', error);
        throw error;
    }
};

// Get public dustbins
exports.getDustbins = async (req, res) => {
    try {
        const [dustbins] = await db.promise().query(
            'SELECT id, name, latitude, longitude, status, dustbin_type FROM public_dustbins ORDER BY name'
        );
        res.status(200).json({ dustbins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get recent requests (last 5 for dashboard feed)
exports.getRecentRequests = async (req, res) => {
    const userId = req.user.id;
    try {
        const [pickups] = await db.promise().query(
            `SELECT id, 'Household Pickup' as type, full_name as title, full_address as location, COALESCE(status, 'pending') as status, created_at FROM household_pickups WHERE user_id = ? AND COALESCE(status, 'pending') != 'cancelled' ORDER BY created_at DESC LIMIT 3`,
            [userId]
        );
        const [reports] = await db.promise().query(
            `SELECT id, CASE report_type WHEN 'street_waste' THEN 'Street Waste Report' WHEN 'dead_animal' THEN 'Dead Animal Report' END as type, description as title, COALESCE(status, 'pending') as status, created_at FROM waste_reports WHERE user_id = ? AND COALESCE(status, 'pending') != 'cancelled' ORDER BY created_at DESC LIMIT 3`,
            [userId]
        );
        const [dustbinReqs] = await db.promise().query(
            `SELECT id, 
            CASE 
                WHEN reason LIKE 'Overflowing dustbin report:%' THEN 'Overflowing Dustbin Report'
                ELSE 'Dustbin Installation Request'
            END as type, 
            reason as title, 
            COALESCE(status, 'pending') as status, 
            created_at 
            FROM dustbin_requests WHERE user_id = ? AND COALESCE(status, 'pending') != 'cancelled' ORDER BY created_at DESC LIMIT 3`,
            [userId]
        );

        const all = [...pickups, ...reports, ...dustbinReqs]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        res.status(200).json({ requests: all });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel a request
exports.cancelRequest = async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // Get request type from query parameter
    const userId = req.user.id;
    
    console.log(`=== CANCEL REQUEST ATTEMPT ===`);
    console.log(`- Request ID: ${id}`);
    console.log(`- Request Type: ${type}`);
    console.log(`- Authenticated User ID: ${userId}`);
    console.log(`- User object:`, req.user);
    console.log(`- Query params:`, req.query);
    
    try {
        console.log(`=== REQUEST OWNERSHIP CHECK ===`);
        console.log(`Looking for request ID ${id} of type ${type} belonging to user ${userId}`);
        
        // Direct mapping based on request type to avoid ID conflicts
        let tableName = '';
        
        switch(type) {
            case 'household_pickup':
                tableName = 'household_pickups';
                break;
            case 'street_waste_report':
            case 'dead_animal_report':
                tableName = 'waste_reports';
                break;
            case 'dustbin_request':
                tableName = 'dustbin_requests';
                break;
            default:
                return res.status(400).json({ message: 'Invalid request type specified' });
        }
        
        console.log(`Checking table: ${tableName}`);
        
        // Verify the request exists and belongs to the user
        const [request] = await db.promise().query(
            `SELECT id, status FROM ${tableName} WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        
        console.log(`${tableName} result:`, request);
        
        if (request.length === 0) {
            return res.status(404).json({ message: 'Request not found or unauthorized' });
        }
        
        console.log(`Match found in ${tableName}, status: ${request[0].status}`);
        
        if (!tableName) {
            return res.status(404).json({ message: 'Request not found or unauthorized' });
        }
        
        // Check current status - can only cancel pending requests
        const currentStatus = request[0].status || 'pending';
        
        console.log(`=== CANCEL REQUEST DEBUG ===`);
        console.log(`Request ID: ${id}`);
        console.log(`Table: ${tableName}`);
        console.log(`Raw status from DB:`, request[0]?.status);
        console.log(`Status type:`, typeof request[0]?.status);
        console.log(`Is NULL:`, request[0]?.status === null);
        console.log(`Is undefined:`, request[0]?.status === undefined);
        console.log(`Length (if string):`, request[0]?.status?.length);
        
        // Handle NULL status as pending for cancellation
        console.log(`Processed status: '${currentStatus}'`);
        
        console.log(`Processed status: '${currentStatus}'`);
        console.log(`Comparing with 'pending':`, currentStatus === 'pending');
        console.log(`========================`);
        
        if (currentStatus !== 'pending') {
            return res.status(400).json({ 
                message: `Only pending requests can be cancelled. Current status is: ${currentStatus}` 
            });
        }
        
        // Update status to cancelled
        await db.promise().query(
            `UPDATE ${tableName} SET status = 'cancelled' WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        
        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset leaderboard (set all eco_points to 0)
exports.resetLeaderboard = async (req, res) => {
    try {
        await db.promise().query('UPDATE users SET eco_points = 0');
        res.json({ message: 'Leaderboard reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get today's waste pickup schedule (citizen visibility)
exports.getTodaySchedule = async (req, res) => {
    try {
        console.log('[CITIZEN_TODAY_SCHEDULE] Fetching today\'s schedule');
        
        // Get current day of week
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        console.log('[CITIZEN_TODAY_SCHEDULE] Today is:', today);
        
        // Get today's wards
        const [todayWards] = await db.promise().query(`
            SELECT ward_number FROM ward_schedule WHERE day_of_week = ?
        `, [today]);
        
        const todayWardNumbers = todayWards.map(w => w.ward_number);
        console.log('[CITIZEN_TODAY_SCHEDULE] Today\'s wards:', todayWardNumbers);
        
        // Get areas for today's wards
        const [areas] = await db.promise().query(`
            SELECT ward_number, area_name, description 
            FROM area_routes 
            WHERE ward_number IN (?)
            ORDER BY ward_number, area_name
        `, [todayWardNumbers]);
        
        console.log('[CITIZEN_TODAY_SCHEDULE] Found areas:', areas.length);
        
        // Group by ward
        const byWard = {};
        for (const area of areas) {
            if (!byWard[area.ward_number]) {
                byWard[area.ward_number] = [];
            }
            byWard[area.ward_number].push({
                area_name: area.area_name,
                description: area.description
            });
        }
        
        console.log('[CITIZEN_TODAY_SCHEDULE] Grouped by ward:', Object.keys(byWard).length);
        
        res.status(200).json({ 
            day: today, 
            wards: todayWardNumbers,
            byWard 
        });
        
    } catch (error) {
        console.error('[CITIZEN_TODAY_SCHEDULE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if citizen profile is complete
exports.checkProfileStatus = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const [users] = await db.promise().query(
            'SELECT id, full_name, age, phone_number, profile_complete FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        const isComplete = user.profile_complete === 1 || 
            (user.full_name && user.age && user.phone_number);
        
        res.status(200).json({ 
            profile_complete: isComplete,
            full_name: user.full_name,
            age: user.age,
            phone_number: user.phone_number
        });
        
    } catch (error) {
        console.error('[CITIZEN_PROFILE] Check status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update citizen profile (mandatory fields: full_name, age, phone_number)
exports.updateProfile = async (req, res) => {
    const { full_name, age, phone_number } = req.body;
    const userId = req.user.id;

    console.log('[CITIZEN_PROFILE] Updating profile for user:', userId, { full_name, age, phone_number });

    // Validation
    if (!full_name || full_name.trim().length < 2) {
        return res.status(400).json({ message: 'Full name is required and must be at least 2 characters' });
    }

    if (!age || age < 1 || age > 150) {
        return res.status(400).json({ message: 'Age must be between 1 and 150' });
    }

    if (!phone_number || phone_number.trim().length < 7) {
        return res.status(400).json({ message: 'Valid phone number is required' });
    }

    try {
        const [result] = await db.promise().query(
            'UPDATE users SET full_name = ?, age = ?, phone_number = ?, profile_complete = 1 WHERE id = ?',
            [full_name.trim(), age, phone_number.trim(), userId]
        );

        console.log('[CITIZEN_PROFILE] Update result:', result);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('[CITIZEN_PROFILE] Profile updated successfully');
        res.status(200).json({ 
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('[CITIZEN_PROFILE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerPickup: exports.registerPickup,
    reportWaste: exports.reportWaste,
    requestDustbin: exports.requestDustbin,
    getRequests: exports.getRequests,
    getStats: exports.getStats,
    getLeaderboard: exports.getLeaderboard,
    getMyPoints: exports.getMyPoints,
    awardPointsForCompletion: exports.awardPointsForCompletion,
    getDustbins: exports.getDustbins,
    getRecentRequests: exports.getRecentRequests,
    cancelRequest: exports.cancelRequest,
    resetLeaderboard: exports.resetLeaderboard,
    getTodaySchedule: exports.getTodaySchedule,
    updateProfile: exports.updateProfile,
    checkProfileStatus: exports.checkProfileStatus
};
