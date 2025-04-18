const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../auth');

// router.use(authenticate);

// Group Analytics
router.get('/groups/:groupId/demographics', analyticsController.getGroupDemographics);
router.get('/groups/:groupId/attendance', analyticsController.getGroupAttendanceStats);
router.get('/groups/:groupId/growth', analyticsController.getGroupGrowthAnalytics);
router.post('/groups/compare', analyticsController.compareGroups);
router.get('/groups/:groupId/engagement', analyticsController.getGroupEngagementMetrics);
router.get('/groups/:groupId/activity-timeline', analyticsController.getGroupActivityTimeline);

// Attendance Analytics
router.get('/attendance/week', analyticsController.getAttendanceByWeek);
router.get('/attendance/month', analyticsController.getAttendanceByMonth);
router.get('/attendance/year', analyticsController.getAttendanceByYear);
router.get('/attendance/period/:period',analyticsController.getAttendanceByPeriod);
router.get('/attendance/overall/:period', analyticsController.getOverallAttendanceByPeriod);
router.get('/attendance/user/:userId',analyticsController.getUserAttendanceTrends);
router.get('/attendance/group/:groupId/trends', analyticsController.getGroupAttendanceTrends);
router.get('/attendance/event-type/:eventType',  analyticsController.getAttendanceByEventType);

// Event Analytics
router.get('/events/:eventId/participation',  analyticsController.getEventParticipationStats);
router.post('/events/compare-attendance', analyticsController.compareEventAttendance);
router.get('/events/upcoming/participation-forecast',  analyticsController.getUpcomingEventsParticipationForecast);
router.get('/events/popular',  analyticsController.getPopularEvents);
router.get('/events/attendance-by-category',  analyticsController.getAttendanceByEventCategory);

// Member Analytics
router.get('/members/participation',  analyticsController.getMemberParticipationStats);
router.get('/members/retention',  analyticsController.getMemberRetentionStats);
router.get('/members/engagement-score',  analyticsController.getMemberEngagementScores);
router.get('/members/activity-levels',  analyticsController.getMemberActivityLevels);
router.get('/members/attendance-correlation', analyticsController.getAttendanceCorrelationFactors);

// Dashboard Analytics
router.get('/dashboard/summary', analyticsController.getDashboardSummary);
router.get('/dashboard/group/:groupId', analyticsController.getGroupDashboardData);
router.get('/dashboard/trends', analyticsController.getDashboardTrends);
router.get('/dashboard/performance-metrics',  analyticsController.getPerformanceMetrics);
router.get('/dashboard/custom/:timeframe',  analyticsController.getCustomDashboardData);

// Export Analytics
router.get('/export/attendance-report',  analyticsController.exportAttendanceReport);
router.get('/export/member-report', analyticsController.exportMemberReport);
router.get('/export/group-report/:groupId',  analyticsController.exportGroupReport);

module.exports = router; 