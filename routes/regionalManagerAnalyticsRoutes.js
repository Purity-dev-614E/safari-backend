const express = require('express');
const router = express.Router();
const regionalManagerAnalyticsController = require('../controllers/regionalManagerAnalyticsController');
const { authenticate } = require('../auth');
const { checkRole } = require('../middleware/regionMiddleware');

// Apply authentication and role check middleware
router.use(authenticate);
router.use(checkRole(['region_manager']));

// Group Analytics
router.get('/groups/:groupId/demographics', regionalManagerAnalyticsController.getGroupDemographics);
router.get('/groups/:groupId/attendance', regionalManagerAnalyticsController.getGroupAttendanceStats);
router.get('/groups/:groupId/growth', regionalManagerAnalyticsController.getGroupGrowthAnalytics);
router.post('/groups/compare', regionalManagerAnalyticsController.compareGroups);

// Attendance Analytics
router.get('/attendance/period/:period', regionalManagerAnalyticsController.getAttendanceByPeriod);
router.get('/attendance/overall/:period', regionalManagerAnalyticsController.getOverallAttendanceByPeriod);
router.get('/attendance/user/:userId', regionalManagerAnalyticsController.getUserAttendanceTrends);

// Event Analytics
router.get('/events/:eventId/participation', regionalManagerAnalyticsController.getEventParticipationStats);
router.post('/events/compare-attendance', regionalManagerAnalyticsController.compareEventAttendance);

// Member Analytics
router.get('/members/participation', regionalManagerAnalyticsController.getMemberParticipationStats);
router.get('/members/activity-status', regionalManagerAnalyticsController.getMemberActivityStatus);

// Dashboard Analytics
router.get('/dashboard/summary', regionalManagerAnalyticsController.getDashboardSummary);

module.exports = router;