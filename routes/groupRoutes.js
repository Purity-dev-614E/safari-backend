const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../auth');

// All group routes are protected
router.use(authenticate);

router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.get('/name', groupController.getGroupByName);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

router.get('/:id/groupDemographics', groupController.getGroupDemographics);

// Group members
router.get('/:id/members', groupController.getGroupMembers);
router.post('/:id/members', groupController.addGroupMember);
router.delete('/:id/members/:userId', groupController.removeGroupMember);

router.get('/admin/:userId/groups', groupController.getAdminGroups); // Ensure this matches the frontend

// Assign admin to group
router.post('/assign-admin', groupController.assignAdminToGroup);

// Fetch attendance by group and period
router.get('/:id/attendance', groupController.getAttendanceByGroupAndPeriod);

// Fetch overall attendance by period
router.get('/attendance', groupController.getOverallAttendanceByPeriod);

module.exports = router;