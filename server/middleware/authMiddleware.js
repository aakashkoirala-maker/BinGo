const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = decoded; // Adds user payload (id, role) to req
        
        // Role-based access control for ADMIN routes only
        // Use originalUrl to get full path including /api/admin prefix
        const fullPath = req.originalUrl || req.url;
        
        // Block /api/admin routes from non-admins
        if (fullPath.startsWith('/api/admin')) {
            if (decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Admin access required. This action has been logged.' });
            }
        }
        
        // Block /api/worker routes from non-workers and non-admins
        if (fullPath.startsWith('/api/worker')) {
            if (decoded.role !== 'worker' && decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Worker access required.' });
            }
        }
        
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
