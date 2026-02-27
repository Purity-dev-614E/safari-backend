const RemovedMembersService = require('../services/removedMembersService');
const { requireRole, checkRegionAccess } = require('../middleware/rbacMiddleware');

class RemovedMembersController {
  /**
   * Remove a member from a group
   * POST /api/groups/:groupId/members/:userId/remove
   */
  static async removeMember(req, res) {
    try {
      const { groupId, userId } = req.params;
      const { reason } = req.body;
      const performer = req.user;

      // Validate reason
      const validation = RemovedMembersService.validateReason(reason);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Remove the member
      const removedMember = await RemovedMembersService.removeMember(
        groupId,
        userId,
        reason,
        performer.id,
        performer
      );

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
        data: removedMember
      });
    } catch (error) {
      console.error('Error removing member:', error);
      
      if (error.message.includes('already removed')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      if (error.message.includes('not found') || error.message.includes('Missing required')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove member'
      });
    }
  }

  /**
   * Get all removed members for a group
   * GET /api/groups/:groupId/removed-members
   */
  static async getGroupRemovedMembers(req, res) {
    try {
      const { groupId } = req.params;
      const performer = req.user;

      const removedMembers = await RemovedMembersService.getGroupRemovedMembers(
        groupId,
        performer
      );

      res.status(200).json({
        success: true,
        data: removedMembers,
        count: removedMembers.length
      });
    } catch (error) {
      console.error('Error getting removed members:', error);
      
      if (error.message.includes('not found') || error.message.includes('required')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get removed members'
      });
    }
  }

  /**
   * Get removal history for a specific user
   * GET /api/users/:userId/removal-history
   */
  static async getUserRemovalHistory(req, res) {
    try {
      const { userId } = req.params;
      const performer = req.user;

      // Users can only see their own removal history unless they have higher privileges
      if (performer.role === 'user' && performer.id !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own removal history'
        });
      }

      const removalHistory = await RemovedMembersService.getUserRemovalHistory(
        userId,
        performer
      );

      res.status(200).json({
        success: true,
        data: removalHistory,
        count: removalHistory.length
      });
    } catch (error) {
      console.error('Error getting user removal history:', error);
      
      if (error.message.includes('not found') || error.message.includes('required')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get removal history'
      });
    }
  }

  /**
   * Get removal statistics for a group
   * GET /api/groups/:groupId/removal-stats
   */
  static async getGroupRemovalStats(req, res) {
    try {
      const { groupId } = req.params;
      const performer = req.user;

      const stats = await RemovedMembersService.getGroupRemovalStats(
        groupId,
        performer
      );

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting removal statistics:', error);
      
      if (error.message.includes('not found') || error.message.includes('required')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get removal statistics'
      });
    }
  }

  /**
   * Get all removed members (admin endpoint)
   * GET /api/admin/removed-members
   */
  static async getAllRemovedMembers(req, res) {
    try {
      const performer = req.user;
      const {
        page = 1,
        limit = 10,
        groupId,
        userId,
        sortBy = 'removed_at',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        groupId,
        userId,
        sortBy,
        sortOrder
      };

      const result = await RemovedMembersService.getAllRemovedMembers(
        options,
        performer
      );

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting all removed members:', error);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get removed members'
      });
    }
  }

  /**
   * Restore a removed member (undo removal)
   * POST /api/groups/:groupId/members/:userId/restore
   */
  static async restoreMember(req, res) {
    try {
      const { groupId, userId } = req.params;
      const performer = req.user;

      const success = await RemovedMembersService.restoreMember(
        groupId,
        userId,
        performer
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Member restored successfully'
        });
      } else {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Failed to restore member'
        });
      }
    } catch (error) {
      console.error('Error restoring member:', error);
      
      if (error.message.includes('not removed')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to restore member'
      });
    }
  }

  /**
   * Check if current user can remove members from a group
   * GET /api/groups/:groupId/can-remove-members
   */
  static async canRemoveMembers(req, res) {
    try {
      const { groupId } = req.params;
      const performer = req.user;

      const canRemove = await RemovedMembersService.canRemoveMember(
        performer,
        groupId
      );

      res.status(200).json({
        success: true,
        data: {
          canRemove,
          userRole: performer.role
        }
      });
    } catch (error) {
      console.error('Error checking removal permissions:', error);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check permissions'
      });
    }
  }
}

module.exports = RemovedMembersController;
