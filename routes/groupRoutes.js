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

// Assign admin to group
router.post('/assign-admin', groupController.assignAdminToGroup);

module.exports = router;