const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../auth');

router.use(authenticate);

// Group Analytics
router.get('/groups/:groupId/demographics', analyticsController.getGroupDemographics);
router.get('/groups/:groupId/attendance', analyticsController.getGroupAttendanceStats);
router.get('/groups/:groupId/growth', analyticsController.getGroupGrowthAnalytics);
router.post('/groups/compare', analyticsController.compareGroups);//test with group ids later


// Attendance Analytics
router.get('/attendance/week', analyticsController.getAttendanceByWeek);
router.get('/attendance/month', analyticsController.getAttendanceByMonth);
router.get('/attendance/year', analyticsController.getAttendanceByYear);
router.get('/attendance/period/:period',analyticsController.getAttendanceByPeriod);
router.get('/attendance/overall/:period', analyticsController.getOverallAttendanceByPeriod);
router.get('/attendance/user/:userId',analyticsController.getUserAttendanceTrends);


// Event Analytics
router.get('/events/:eventId/participation',  analyticsController.getEventParticipationStats);
router.post('/events/compare-attendance', analyticsController.compareEventAttendance);


// Member Analytics
router.get('/members/participation',  analyticsController.getMemberParticipationStats);
router.get('/members/retention',  analyticsController.getMemberRetentionStats);
router.get('/members/activity-status', analyticsController.getMemberActivityStatus);


// Dashboard Analytics
router.get('/dashboard/summary', analyticsController.getDashboardSummary);
router.get('/dashboard/group/:groupId', analyticsController.getGroupDashboardData);



module.exports = router; 