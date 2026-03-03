const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../auth');
const { requireRole, checkRegionAccess } = require('../middleware/rbacMiddleware');

// All group routes are protected
router.use(authenticate);

// Group CRUD operations with RBAC
router.post('/', requireRole('admin', 'regional manager', 'super admin', 'root'), groupController.createGroup);
router.get('/', checkRegionAccess, groupController.getAllGroups);

// Get all groups for profile selection (bypasses RBAC restrictions)
router.get('/all-for-profile', groupController.getAllGroupsForProfile);

router.get('/:id', groupController.getGroupById);
router.get('/name', groupController.getGroupByName);
router.put('/:id',  groupController.updateGroup);
router.delete('/:id', requireRole('super admin'), groupController.deleteGroup);

router.get('/:id/groupDemographics', groupController.getGroupDemographics);

// Group members
router.get('/:id/members', groupController.getGroupMembers);
router.post('/:id/members',  groupController.addGroupMember);
router.delete('/:id/members/:userId',  groupController.removeGroupMember);

router.get('/admin/:userId/groups', groupController.getAdminGroups); // Ensure this matches the frontend

// Get groups by user ID
router.get('/user/:userId', groupController.getGroupsByUserId);

// Assign admin to group - only root, super admin, regional manager
router.post('/assign-admin', groupController.assignAdminToGroup);

// Fetch attendance by group and period
router.get('/:id/attendance', groupController.getAttendanceByGroupAndPeriod);

// Fetch overall attendance by period
router.get('/attendance/:period', groupController.getOverallAttendanceByPeriod);

module.exports = router;
