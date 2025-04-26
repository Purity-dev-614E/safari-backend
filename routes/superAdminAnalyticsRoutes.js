const express = require('express');
const router = express.Router();
const superAdminAnalyticsController = require('../controllers/superAdminAnalyticsController');
const { authenticate } = require('../auth');
const { checkRole } = require('../middleware/regionMiddleware');

// Apply authentication and role check middleware
router.use(authenticate);
router.use(checkRole(['super admin']));

// Group Analytics
router.get('/groups/:groupId/demographics', superAdminAnalyticsController.getGroupDemographics);
router.get('/groups/:groupId/attendance', superAdminAnalyticsController.getGroupAttendanceStats);
router.get('/groups/:groupId/growth', superAdminAnalyticsController.getGroupGrowthAnalytics);
router.post('/groups/compare', superAdminAnalyticsController.compareGroups);

// Attendance Analytics
router.get('/attendance/period/:period', superAdminAnalyticsController.getAttendanceByPeriod);
router.get('/attendance/overall/:period', superAdminAnalyticsController.getOverallAttendanceByPeriod);
router.get('/attendance/user/:userId', superAdminAnalyticsController.getUserAttendanceTrends);

// Event Analytics
router.get('/events/:eventId/participation', superAdminAnalyticsController.getEventParticipationStats);
router.post('/events/compare-attendance', superAdminAnalyticsController.compareEventAttendance);

// Member Analytics
router.get('/members/participation', superAdminAnalyticsController.getMemberParticipationStats);
router.get('/members/activity-status', superAdminAnalyticsController.getMemberActivityStatus);

// Dashboard Analytics
router.get('/dashboard/summary', superAdminAnalyticsController.getDashboardSummary);
router.get('/dashboard/group/:groupId', superAdminAnalyticsController.getGroupDashboardData);

module.exports = router;