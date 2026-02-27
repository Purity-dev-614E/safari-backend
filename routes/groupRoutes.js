const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate } = require('../auth');
const { requireRole, checkRegionAccess } = require('../middleware/rbacMiddleware');

// All group routes are protected
router.use(authenticate);

// Group CRUD operations with RBAC
router.post('/', requireRole('admin'), checkRegionAccess, groupController.createGroup);
router.get('/', checkRegionAccess, groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.get('/name', groupController.getGroupByName);
router.put('/:id', requireRole('admin'), groupController.updateGroup);
router.delete('/:id', requireRole('super admin'), groupController.deleteGroup);

router.get('/:id/groupDemographics', groupController.getGroupDemographics);

// Group members
router.get('/:id/members', groupController.getGroupMembers);
router.post('/:id/members', requireRole('admin'), groupController.addGroupMember);
router.delete('/:id/members/:userId', requireRole('admin'), groupController.removeGroupMember);

router.get('/admin/:userId/groups', groupController.getAdminGroups); // Ensure this matches the frontend

// Get groups by user ID
router.get('/user/:userId', groupController.getGroupsByUserId);

// Assign admin to group - only root, super admin, regional manager
router.post('/assign-admin', requireRole('regional manager'), groupController.assignAdminToGroup);

// Fetch attendance by group and period
router.get('/:id/attendance', groupController.getAttendanceByGroupAndPeriod);

// Fetch overall attendance by period
router.get('/attendance/:period', requireRole('admin'), groupController.getOverallAttendanceByPeriod);

module.exports = router;
