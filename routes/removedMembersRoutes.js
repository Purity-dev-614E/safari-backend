const express = require('express');
const RemovedMembersController = require('../controllers/removedMembersController');
const { requireRole, checkRegionAccess } = require('../middleware/rbacMiddleware');
const { authenticate } = require('../auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Group-specific removed members routes
 * These routes are nested under /api/groups/:groupId
 */

// Remove a member from a group
// POST /api/groups/:groupId/members/:userId/remove
router.post('/groups/:groupId/members/:userId/remove', 
  requireRole('admin'), // Minimum role required
  RemovedMembersController.removeMember
);

// Get all removed members for a group
// GET /api/groups/:groupId/removed-members
router.get('/groups/:groupId/removed-members',
  requireRole('admin'), // Minimum role required
  RemovedMembersController.getGroupRemovedMembers
);

// Get removal statistics for a group
// GET /api/groups/:groupId/removal-stats
router.get('/groups/:groupId/removal-stats',
  requireRole('admin'), // Minimum role required
  RemovedMembersController.getGroupRemovalStats
);

// Check if current user can remove members from a group
// GET /api/groups/:groupId/can-remove-members
router.get('/groups/:groupId/can-remove-members',
  RemovedMembersController.canRemoveMembers
);

// Restore a removed member (undo removal)
// POST /api/groups/:groupId/members/:userId/restore
router.post('/groups/:groupId/members/:userId/restore',
  requireRole('admin'), // Minimum role required
  RemovedMembersController.restoreMember
);

/**
 * User-specific removal history routes
 * These routes are nested under /api/users/:userId
 */

// Get removal history for a specific user
// GET /api/users/:userId/removal-history
router.get('/users/:userId/removal-history',
  RemovedMembersController.getUserRemovalHistory
);

/**
 * Admin routes for managing all removed members
 * These routes are nested under /api/admin
 */

// Get all removed members with pagination and filtering
// GET /api/admin/removed-members
router.get('/admin/removed-members',
  requireRole('admin'), // Minimum role required
  RemovedMembersController.getAllRemovedMembers
);

module.exports = router;
