const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../auth');

// Group Analytics
router.get('/groups/:groupId/demographics', authenticate, analyticsController.getGroupDemographics);
router.get('/groups/:groupId/attendance', authenticate, analyticsController.getGroupAttendanceStats);
router.get('/groups/:groupId/growth', authenticate, analyticsController.getGroupGrowthAnalytics);
router.post('/groups/compare', authenticate, analyticsController.compareGroups);
router.get('/groups/:groupId/engagement', authenticate, analyticsController.getGroupEngagementMetrics);
router.get('/groups/:groupId/activity-timeline', authenticate, analyticsController.getGroupActivityTimeline);

// Attendance Analytics
router.get('/attendance/week', authenticate, analyticsController.getAttendanceByWeek);
router.get('/attendance/month', authenticate, analyticsController.getAttendanceByMonth);
router.get('/attendance/year', authenticate, analyticsController.getAttendanceByYear);
router.get('/attendance/period/:period', authenticate, analyticsController.getAttendanceByPeriod);
router.get('/attendance/overall/:period', authenticate, analyticsController.getOverallAttendanceByPeriod);
router.get('/attendance/user/:userId', authenticate, analyticsController.getUserAttendanceTrends);
router.get('/attendance/group/:groupId/trends', authenticate, analyticsController.getGroupAttendanceTrends);
router.get('/attendance/event-type/:eventType', authenticate, analyticsController.getAttendanceByEventType);

// Event Analytics
router.get('/events/:eventId/participation', authenticate, analyticsController.getEventParticipationStats);
router.post('/events/compare-attendance', authenticate, analyticsController.compareEventAttendance);
router.get('/events/upcoming/participation-forecast', authenticate, analyticsController.getUpcomingEventsParticipationForecast);
router.get('/events/popular', authenticate, analyticsController.getPopularEvents);
router.get('/events/attendance-by-category', authenticate, analyticsController.getAttendanceByEventCategory);

// Member Analytics
router.get('/members/participation', authenticate, analyticsController.getMemberParticipationStats);
router.get('/members/retention', authenticate, analyticsController.getMemberRetentionStats);
router.get('/members/engagement-score', authenticate, analyticsController.getMemberEngagementScores);
router.get('/members/activity-levels', authenticate, analyticsController.getMemberActivityLevels);
router.get('/members/attendance-correlation', authenticate, analyticsController.getAttendanceCorrelationFactors);

// Dashboard Analytics
router.get('/dashboard/summary', authenticate, analyticsController.getDashboardSummary);
router.get('/dashboard/group/:groupId', authenticate, analyticsController.getGroupDashboardData);
router.get('/dashboard/trends', authenticate, analyticsController.getDashboardTrends);
router.get('/dashboard/performance-metrics', authenticate, analyticsController.getPerformanceMetrics);
router.get('/dashboard/custom/:timeframe', authenticate, analyticsController.getCustomDashboardData);

// Export Analytics
router.get('/export/attendance-report', authenticate, analyticsController.exportAttendanceReport);
router.get('/export/member-report', authenticate, analyticsController.exportMemberReport);
router.get('/export/group-report/:groupId', authenticate, analyticsController.exportGroupReport);

module.exports = router; 