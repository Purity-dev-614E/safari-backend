const express = require('express');
const router = express.Router();
const memberActivityController = require('../controllers/memberActivityController');
const { authenticate } = require('../auth');

// All member activity routes are protected
router.use(authenticate);

// Member status endpoints
router.put('/groups/:groupId/members/:userId/status', memberActivityController.updateMemberStatus);
router.get('/groups/:groupId/members/activity-status', memberActivityController.getGroupMemberActivityStatus);

// Member inactivity computation endpoints
router.post('/groups/:groupId/members/compute-inactive', memberActivityController.computeMembersToMarkInactive);
router.post('/groups/:groupId/members/check-inactive', memberActivityController.checkAndMarkInactive);

// Group activity status endpoints
router.get('/groups/:groupId/activity-status', memberActivityController.getGroupActivityStatus);
router.get('/groups/activity-status', memberActivityController.getAllGroupsActivityStatus);

module.exports = router;
