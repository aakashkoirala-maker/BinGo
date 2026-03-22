const db = require('../config/db');

// Get citizen leaderboard (read-only for workers)
exports.getLeaderboard = async (req, res) => {
    try {
        console.log('[WORKER_LEADERBOARD] Fetching citizen leaderboard');
        
        const [users] = await db.promise().query(`
            SELECT 
                id,
                full_name,
                eco_points,
                (
                    SELECT COUNT(*) FROM household_pickups WHERE user_id = users.id
                ) +
                (
                    SELECT COUNT(*) FROM dustbin_requests WHERE user_id = users.id
                ) as total_contributions
            FROM users 
            WHERE role = 'citizen' AND eco_points > 0 
            ORDER BY eco_points DESC 
            LIMIT 20`
        );
        
        console.log('[WORKER_LEADERBOARD] Found users:', users.length);
        
        res.status(200).json({ leaderboard: users });
        
    } catch (error) {
        console.error('[WORKER_LEADERBOARD] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get worker tasks/stats (real-time)
exports.getWorkerTasks = async (req, res) => {
    try {
        const workerId = req.user.id;
        console.log('[WORKER_TASKS] Fetching tasks for worker:', workerId);

        const [rows] = await db.promise().query(
            `SELECT
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS assignedTasks,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS inProgressTasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS totalCompleted,
                SUM(CASE WHEN status = 'completed' AND DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS completedToday
             FROM waste_reports
             WHERE worker_id = ?`,
            [workerId]
        );

        const stats = rows[0] || {};
        res.status(200).json({
            assignedTasks: stats.assignedTasks || 0,
            inProgressTasks: stats.inProgressTasks || 0,
            completedToday: stats.completedToday || 0,
            totalCompleted: stats.totalCompleted || 0
        });

    } catch (error) {
        console.error('[WORKER_TASKS] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const normalizeDateIso = (value) => {
    try {
        const d = new Date(value);
        if (Number.isNaN(d)) return null;
        return d.toISOString();
    } catch (_) {
        return null;
    }
};

// Get active notices for workers (only non-expired)
exports.getActiveNotices = async (req, res) => {
    try {
        const userRole = req.user.role;
        console.log('[WORKER_NOTICES] Fetching notices for role:', userRole);
        
        // Only allow workers to access this endpoint
        if (userRole !== 'worker') {
            console.log('[WORKER_NOTICES] Access denied - not a worker');
            return res.status(403).json({ message: 'Worker access required' });
        }
        
        // Get only active notices (expires_at >= today)
        const [notices] = await db.promise().query(`
            SELECT 
                id,
                title,
                description,
                created_at,
                expires_at,
                'active' as status
            FROM notices
            WHERE expires_at >= CURDATE()
            ORDER BY created_at DESC
        `);
        
        console.log('[WORKER_NOTICES] Found active notices:', notices.length);
        console.log('[WORKER_NOTICES] Sample:', notices.slice(0, 2).map(n => ({ id: n.id, title: n.title, expires_at: n.expires_at, status: n.status })));
        
        // Normalize dates to YYYY-MM-DD format to avoid timezone issues
        const normalizedNotices = notices.map(notice => ({
            ...notice,
            expires_at_iso: normalizeDateIso(notice.expires_at),
            created_at_iso: normalizeDateIso(notice.created_at)
        }));
        
        console.log('[WORKER_NOTICES] Normalized sample:', normalizedNotices.slice(0, 2).map(n => ({ id: n.id, expires_at: n.expires_at })));
        
        res.status(200).json({ notices: normalizedNotices });
        
    } catch (error) {
        console.error('[WORKER_NOTICES] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get active emergency contacts for workers (only is_active = true)
exports.getActiveEmergencyContacts = async (req, res) => {
    try {
        const userRole = req.user.role;
        console.log('[WORKER_EMERGENCY_CONTACTS] Fetching contacts for role:', userRole);
        
        // Only allow workers to access this endpoint
        if (userRole !== 'worker') {
            console.log('[WORKER_EMERGENCY_CONTACTS] Access denied - not a worker');
            return res.status(403).json({ message: 'Worker access required' });
        }
        
        // Get only active contacts (is_active = true)
        const [contacts] = await db.promise().query(`
            SELECT 
                id,
                service_name,
                phone_number
            FROM emergency_contacts
            WHERE is_active = TRUE
            ORDER BY service_name ASC
        `);
        
        console.log('[WORKER_EMERGENCY_CONTACTS] Found active contacts:', contacts.length);
        console.log('[WORKER_EMERGENCY_CONTACTS] Sample:', contacts.slice(0, 2).map(c => ({ id: c.id, service_name: c.service_name })));
        
        res.status(200).json({ contacts });
        
    } catch (error) {
        console.error('[WORKER_EMERGENCY_CONTACTS] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get worker's assigned areas for today
exports.getTodaySchedule = async (req, res) => {
    try {
        const workerId = req.user.id;
        console.log('[WORKER_SCHEDULE] Fetching today\'s schedule for worker:', workerId);
        
        // Get current day of week
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        console.log('[WORKER_SCHEDULE] Today is:', today);
        
        // Get worker's assigned areas
        const [assignments] = await db.promise().query(`
            SELECT 
                ar.id as area_id,
                ar.ward_number,
                ar.area_name,
                ar.description
            FROM area_routes ar
            JOIN worker_area_assignments waa ON ar.id = waa.area_id
            WHERE waa.worker_id = ?
            ORDER BY ar.ward_number, ar.area_name
        `, [workerId]);
        
        console.log('[WORKER_SCHEDULE] Found assignments:', assignments.length);
        
        // Get today's wards
        const [todayWards] = await db.promise().query(`
            SELECT ward_number FROM ward_schedule WHERE day_of_week = ?
        `, [today]);
        
        const todayWardNumbers = todayWards.map(w => w.ward_number);
        console.log('[WORKER_SCHEDULE] Today\'s wards:', todayWardNumbers);
        
        // Filter assignments to only show today's wards
        const todayAssignments = assignments.filter(a => todayWardNumbers.includes(a.ward_number));
        
        console.log('[WORKER_SCHEDULE] Today\'s assignments:', todayAssignments.length);
        
        res.status(200).json({ 
            day: today, 
            wards: todayWardNumbers,
            assignments: todayAssignments 
        });
        
    } catch (error) {
        console.error('[WORKER_SCHEDULE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get ALL household waste pickups (read-only for workers)
exports.getAllHouseholdPickups = async (req, res) => {
    try {
        console.log('[WORKER_HOUSEHOLD] Fetching all household waste pickups');
        
        // Get all ward schedules with days
        const [wardSchedules] = await db.promise().query(`
            SELECT id, day_of_week, ward_number 
            FROM ward_schedule 
            ORDER BY FIELD(day_of_week, 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), ward_number
        `);
        
        // Get all areas with their assigned workers
        const [areas] = await db.promise().query(`
            SELECT 
                ar.id as area_id,
                ar.ward_number,
                ar.area_name,
                ar.description,
                GROUP_CONCAT(DISTINCT u.full_name ORDER BY u.full_name SEPARATOR ', ') as assigned_workers
            FROM area_routes ar
            LEFT JOIN worker_area_assignments waa ON ar.id = waa.area_id
            LEFT JOIN users u ON waa.worker_id = u.id
            GROUP BY ar.id
            ORDER BY ar.ward_number, ar.area_name
        `);
        
        console.log('[WORKER_HOUSEHOLD] Found wards:', wardSchedules.length, 'areas:', areas.length);
        
        // Organize data by day
        const byDay = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days.forEach(day => { byDay[day] = []; });
        
        // Add ward schedules to byDay
        wardSchedules.forEach(ws => {
            byDay[ws.day_of_week].push({
                ward_number: ws.ward_number,
                areas: []
            });
        });
        
        // Add areas to their wards
        areas.forEach(area => {
            // Find this area's ward in each day's schedule
            days.forEach(day => {
                const dayWards = byDay[day];
                const wardEntry = dayWards.find(w => w.ward_number === area.ward_number);
                if (wardEntry) {
                    wardEntry.areas.push({
                        area_id: area.area_id,
                        area_name: area.area_name,
                        description: area.description || '-',
                        assigned_workers: area.assigned_workers || 'None'
                    });
                }
            });
        });
        
        res.status(200).json({ 
            success: true,
            byDay,
            totalWards: wardSchedules.length,
            totalAreas: areas.length
        });
        
    } catch (error) {
        console.error('[WORKER_HOUSEHOLD] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all approved street waste reports for workers
exports.getStreetWasteReports = async (req, res) => {
    try {
        const workerId = req.user.id;
        console.log('[WORKER_GARBAGE] Fetching in-progress street waste reports for worker:', workerId);
        
        const query = `
            SELECT 
                wr.id,
                wr.report_type,
                wr.waste_type,
                wr.description,
                wr.latitude,
                wr.longitude,
                wr.status,
                wr.created_at,
                u.id as citizen_id,
                u.full_name as citizen_name
            FROM waste_reports wr
            JOIN users u ON wr.user_id = u.id
            WHERE wr.report_type = 'street_waste'
              AND wr.status = 'in_progress'
              AND wr.worker_id = ?
            ORDER BY wr.created_at DESC
        `;
        
        const [reports] = await db.promise().query(query, [workerId]);
        
        console.log('[WORKER_GARBAGE] Found reports:', reports.length);
        
        res.status(200).json({ 
            success: true,
            reports
        });
        
    } catch (error) {
        console.error('[WORKER_GARBAGE] Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Update waste report status (resolve or cancel)
exports.updateWasteReportStatus = async (req, res) => {
    const { reportId } = req.params;
    const { status, worker_note } = req.body;
    const workerId = req.user.id;
    
    console.log('[WORKER_GARBAGE] Updating report:', reportId, 'to status:', status);
    
    if (!status || !['in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    
    try {
        const [rows] = await db.promise().query(
            'SELECT id, status, worker_id FROM waste_reports WHERE id = ?',
            [reportId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const record = rows[0];
        if (!record.worker_id || record.worker_id !== workerId) {
            return res.status(403).json({ message: 'You are not assigned to this report' });
        }

        if (record.status !== 'in_progress') {
            return res.status(400).json({ message: 'Report must be in progress to update status' });
        }

        const [result] = await db.promise().query(
            'UPDATE waste_reports SET status = ?, worker_note = ?, updated_by = ?, worker_id = ? WHERE id = ?',
            [status, worker_note || null, workerId, workerId, reportId]
        );
        
        console.log('[WORKER_GARBAGE] Update result:', result);
        
        console.log('[WORKER_GARBAGE] Report updated successfully');
        res.status(200).json({ 
            success: true,
            message: status === 'completed' ? 'Report marked as resolved' : 
                    status === 'cancelled' ? 'Report cancelled' : 'Status updated'
        });
        
    } catch (error) {
        console.error('[WORKER_GARBAGE] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all approved dead animal reports for workers
exports.getDeadAnimalReports = async (req, res) => {
    try {
        const workerId = req.user.id;
        console.log('[WORKER_DEAD_ANIMAL] Fetching in-progress dead animal reports for worker:', workerId);
        
        const query = `
            SELECT 
                wr.id,
                wr.report_type,
                wr.waste_type,
                wr.description,
                wr.latitude,
                wr.longitude,
                wr.status,
                wr.created_at,
                u.id as citizen_id,
                u.full_name as citizen_name
            FROM waste_reports wr
            JOIN users u ON wr.user_id = u.id
            WHERE wr.report_type = 'dead_animal'
              AND wr.status = 'in_progress'
              AND wr.worker_id = ?
            ORDER BY wr.created_at DESC
        `;
        
        const [reports] = await db.promise().query(query, [workerId]);
        
        console.log('[WORKER_DEAD_ANIMAL] Found reports:', reports.length);
        
        res.status(200).json({ 
            success: true,
            reports
        });
        
    } catch (error) {
        console.error('[WORKER_DEAD_ANIMAL] Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Get dustbin installation requests for workers
exports.getDustbinInstallationRequests = async (req, res) => {
    try {
        const workerId = req.user.id;
        console.log('[WORKER_DUSTBIN_INSTALL] Fetching in-progress dustbin installation requests for worker:', workerId);
        
        const query = `
            SELECT 
                dr.id,
                dr.area_type,
                dr.estimated_users,
                dr.reason,
                dr.latitude,
                dr.longitude,
                dr.status,
                dr.created_at,
                u.id as citizen_id,
                u.full_name as citizen_name
            FROM dustbin_requests dr
            JOIN users u ON dr.user_id = u.id
            WHERE dr.status = 'in_progress'
              AND dr.worker_id = ?
              AND dr.reason NOT LIKE 'Overflowing dustbin report:%'
            ORDER BY dr.created_at DESC
        `;
        
        const [requests] = await db.promise().query(query, [workerId]);
        
        console.log('[WORKER_DUSTBIN_INSTALL] Found requests:', requests.length);
        
        res.status(200).json({ 
            success: true,
            requests
        });
        
    } catch (error) {
        console.error('[WORKER_DUSTBIN_INSTALL] Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Get dustbin maintenance requests (overflowing dustbins) for workers
exports.getDustbinMaintenanceRequests = async (req, res) => {
    try {
        const workerId = req.user.id;
        console.log('[WORKER_DUSTBIN_MAINTENANCE] Fetching in-progress dustbin maintenance requests for worker:', workerId);
        
        const query = `
            SELECT 
                dr.id,
                dr.area_type,
                dr.estimated_users,
                dr.reason,
                dr.latitude,
                dr.longitude,
                dr.status,
                dr.created_at,
                u.id as citizen_id,
                u.full_name as citizen_name
            FROM dustbin_requests dr
            JOIN users u ON dr.user_id = u.id
            WHERE dr.status = 'in_progress'
              AND dr.worker_id = ?
              AND dr.reason LIKE 'Overflowing dustbin report:%'
            ORDER BY dr.created_at DESC
        `;
        
        const [requests] = await db.promise().query(query, [workerId]);
        
        console.log('[WORKER_DUSTBIN_MAINTENANCE] Found requests:', requests.length);
        
        res.status(200).json({ 
            success: true,
            requests
        });
        
    } catch (error) {
        console.error('[WORKER_DUSTBIN_MAINTENANCE] Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Update dustbin request status (resolve or cancel)
exports.updateDustbinRequestStatus = async (req, res) => {
    const { requestId } = req.params;
    const { status, worker_note } = req.body;
    const workerId = req.user.id;
    
    console.log('[WORKER_DUSTBIN] Updating request:', requestId, 'to status:', status);
    
    if (!status || !['completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    
    try {
        const [rows] = await db.promise().query(
            'SELECT id, status, worker_id FROM dustbin_requests WHERE id = ?',
            [requestId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const record = rows[0];
        if (!record.worker_id || record.worker_id !== workerId) {
            return res.status(403).json({ message: 'You are not assigned to this request' });
        }

        if (!['in_progress'].includes(record.status)) {
            return res.status(400).json({ message: 'Request must be in progress and assigned before updates' });
        }

        const [result] = await db.promise().query(
            'UPDATE dustbin_requests SET status = ?, worker_note = ?, updated_by = ?, worker_id = ? WHERE id = ?',
            [status, worker_note || null, workerId, workerId, requestId]
        );
        
        console.log('[WORKER_DUSTBIN] Update result:', result);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        console.log('[WORKER_DUSTBIN] Request updated successfully');
        res.status(200).json({ 
            success: true,
            message: status === 'completed' ? 'Request marked as resolved' : 'Request cancelled'
        });
        
    } catch (error) {
        console.error('[WORKER_DUSTBIN] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
