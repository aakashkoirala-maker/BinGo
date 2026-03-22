const express = require('express');
const router = express.Router();
const { 
    getDashboardStats, 
    getRecentRequests, 
    getTopWorkers,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getAllWorkers,
    getWorkerDetails,
    createWorker,
    updateWorker,
    deleteWorker,
    resetWorkerPassword,
    getPendingRequests,
    getApprovedRequests,
    getRequestDetails,
    approveRequest,
    assignWorker,
    updateRequestStatus,
    getCitizenStats,
    getAllCitizens,
    deleteCitizen,
    getCitizenLeaderboard,
    getAllNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    getAllEmergencyContacts,
    createEmergencyContact,
    updateEmergencyContact,
    toggleEmergencyContactStatus,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    getWardSchedules,
    addWardSchedule,
    removeWardSchedule,
    getAreaRoutes,
    addAreaRoute,
    updateAreaRoute,
    deleteAreaRoute,
    assignWorkerToArea,
    removeWorkerFromArea,
    getAllWorkersForAssignment
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all admin routes
router.use(authMiddleware);

// Dashboard routes
router.get('/dashboard-stats', getDashboardStats);
router.get('/recent-requests', getRecentRequests);
router.get('/top-workers', getTopWorkers);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Request management routes (updated)
router.get('/requests/pending', getPendingRequests);
router.get('/requests/approved', getApprovedRequests);
router.get('/requests/:requestId/:requestType', getRequestDetails);
router.put('/requests/:requestId/:requestType/approve', approveRequest);
router.put('/requests/:requestId/:requestType/assign', assignWorker);
router.put('/requests/:requestId/:requestType/status', updateRequestStatus);

// Worker management routes
router.get('/workers', getAllWorkers);
router.get('/workers/:workerId', getWorkerDetails);
router.post('/workers', createWorker);
router.put('/workers/:workerId', updateWorker);
router.delete('/workers/:workerId', deleteWorker);
router.put('/workers/:workerId/reset-password', resetWorkerPassword);

// Citizen management routes
router.get('/citizens/stats', getCitizenStats);
router.get('/citizens', getAllCitizens);
router.delete('/citizens/:citizenId', deleteCitizen);
router.get('/citizens/leaderboard', getCitizenLeaderboard);

// Notice management routes
router.get('/notices', getAllNotices);
router.post('/notices', createNotice);
router.put('/notices/:noticeId', updateNotice);
router.delete('/notices/:noticeId', deleteNotice);

// Emergency Contact management routes
router.get('/emergency-contacts', getAllEmergencyContacts);
router.post('/emergency-contacts', createEmergencyContact);
router.put('/emergency-contacts/:contactId', updateEmergencyContact);
router.patch('/emergency-contacts/:contactId/status', toggleEmergencyContactStatus);

// Admin Profile routes (single admin)
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/profile/password', changeAdminPassword);

// Household Waste Pickup Schedule routes
router.get('/schedule/wards', getWardSchedules);
router.post('/schedule/wards', addWardSchedule);
router.delete('/schedule/wards/:scheduleId', removeWardSchedule);
router.get('/schedule/areas', getAreaRoutes);
router.post('/schedule/areas', addAreaRoute);
router.put('/schedule/areas/:areaId', updateAreaRoute);
router.delete('/schedule/areas/:areaId', deleteAreaRoute);
router.post('/schedule/assign-worker', assignWorkerToArea);
router.delete('/schedule/assign-worker/:assignmentId', removeWorkerFromArea);
router.get('/schedule/workers', getAllWorkersForAssignment);

module.exports = router;