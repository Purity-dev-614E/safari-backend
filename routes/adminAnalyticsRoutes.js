const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const { authenticate } = require('../auth');
const { checkRole } = require('../middleware/regionMiddleware');

// Apply authentication and role check middleware
router.use(authenticate);
router.use(checkRole(['admin']));

// Group Analytics - Admin can only access their own group
router.get('/groups/:groupId/demographics', adminAnalyticsController.getGroupDemographics);
router.get('/groups/:groupId/attendance', adminAnalyticsController.getGroupAttendanceStats);


// Attendance Analytics - Admin can only access their own group's attendance
router.get('/groups/:groupId/attendance/period/:period', adminAnalyticsController.getGroupAttendanceByPeriod);

// Event Analytics - Admin can only access their own group's events
router.get('/events/:eventId/participation', adminAnalyticsController.getEventParticipationStats);

// Member Analytics - Admin can only access members of their own group
router.get('/groups/:groupId/members/participation', adminAnalyticsController.getGroupMemberParticipationStats);
router.get('/groups/:groupId/members/activity-status', adminAnalyticsController.getGroupMemberActivityStatus);

// Dashboard Analytics - Admin can only access their own group's dashboard
router.get('/groups/:groupId/dashboard', adminAnalyticsController.getGroupDashboardData);

module.exports = router;