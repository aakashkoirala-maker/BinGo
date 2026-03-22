const express = require('express');
const router = express.Router();
const { registerPickup, reportWaste, requestDustbin, getRequests, getStats, getLeaderboard, getMyPoints, getDustbins, getRecentRequests, cancelRequest, resetLeaderboard, getTodaySchedule, updateProfile, checkProfileStatus } = require('../controllers/citizenController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Profile update (mandatory for first-time users)
router.put('/profile', updateProfile);
router.get('/profile-status', checkProfileStatus);

router.post('/register-pickup', registerPickup);
router.post('/report-waste', reportWaste);
router.post('/request-dustbin', requestDustbin);
router.get('/requests', getRequests);
router.put('/requests/:id/cancel', cancelRequest);
router.get('/recent-requests', getRecentRequests);
router.get('/stats', getStats);
router.get('/leaderboard', getLeaderboard);
router.get('/my-points', getMyPoints);
router.get('/dustbins', getDustbins);
router.get('/today-schedule', getTodaySchedule);

// Admin only routes
router.post('/reset-leaderboard', resetLeaderboard);

module.exports = router;
