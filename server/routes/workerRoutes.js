const express = require('express');
const router = express.Router();
const { getActiveNotices, getWorkerTasks, getActiveEmergencyContacts, getLeaderboard, getTodaySchedule, getAllHouseholdPickups, getStreetWasteReports, updateWasteReportStatus, getDeadAnimalReports, getDustbinInstallationRequests, getDustbinMaintenanceRequests, updateDustbinRequestStatus } = require('../controllers/workerController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all worker routes
router.use(authMiddleware);

// Worker can access these routes
router.get('/notices', getActiveNotices);
router.get('/tasks', getWorkerTasks);
router.get('/emergency-contacts', getActiveEmergencyContacts);
router.get('/leaderboard', getLeaderboard);
router.get('/today-schedule', getTodaySchedule);
router.get('/household-pickups', getAllHouseholdPickups);
router.get('/street-waste-reports', getStreetWasteReports);
router.patch('/street-waste-reports/:reportId', updateWasteReportStatus);
router.get('/dead-animal-reports', getDeadAnimalReports);
router.get('/dustbin-installation-requests', getDustbinInstallationRequests);
router.get('/dustbin-maintenance-requests', getDustbinMaintenanceRequests);
router.patch('/dustbin-requests/:requestId', updateDustbinRequestStatus);

module.exports = router;
