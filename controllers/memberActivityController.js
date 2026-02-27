const memberActivityService = require('../services/memberActivityService');
const groupActivityService = require('../services/groupActivityService');
const { authenticate } = require('../auth');

module.exports = {
  /**
   * Update member activity status
   * PUT /api/groups/:groupId/members/:userId/status
   */
  async updateMemberStatus(req, res) {
    try {
      const { groupId, userId } = req.params;
      const { is_active } = req.body;

      // Validate input
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ 
          error: 'is_active must be a boolean value' 
        });
      }

      // Check authorization - only group admins, regional managers, or super admins
      const user = req.user;
      const hasPermission = await this.checkMemberStatusPermission(user, groupId);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions to update member status' 
        });
      }

      const result = await memberActivityService.updateMemberActivityStatus(
        groupId, 
        userId, 
        is_active
      );

      res.status(200).json({
        success: true,
        data: result,
        message: `Member status updated to ${is_active ? 'active' : 'inactive'}`
      });
    } catch (error) {
      console.error('Error updating member status:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to update member status' 
      });
    }
  },

  /**
   * Get group member activity status
   * GET /api/groups/:groupId/members/activity-status
   */
  async getGroupMemberActivityStatus(req, res) {
    try {
      const { groupId } = req.params;

      const members = await memberActivityService.getGroupMemberActivityStatus(groupId);

      res.status(200).json({
        success: true,
        data: members
      });
    } catch (error) {
      console.error('Error fetching group member activity status:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch member activity status' 
      });
    }
  },

  /**
   * Compute members to mark inactive
   * POST /api/groups/:groupId/members/compute-inactive
   */
  async computeMembersToMarkInactive(req, res) {
    try {
      const { groupId } = req.params;

      const inactiveMembers = await memberActivityService.computeMembersToMarkInactive(groupId);

      res.status(200).json({
        success: true,
        data: {
          inactive_members: inactiveMembers,
          count: inactiveMembers.length
        }
      });
    } catch (error) {
      console.error('Error computing inactive members:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to compute inactive members' 
      });
    }
  },

  /**
   * Check and mark inactive members after attendance
   * POST /api/groups/:groupId/members/check-inactive
   */
  async checkAndMarkInactive(req, res) {
    try {
      const { groupId } = req.params;

      const markedMembers = await memberActivityService.checkAndMarkInactiveAfterAttendance(groupId);

      res.status(200).json({
        success: true,
        data: {
          marked_inactive: markedMembers,
          count: markedMembers.length
        },
        message: `Marked ${markedMembers.length} members as inactive`
      });
    } catch (error) {
      console.error('Error checking and marking inactive members:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to check and mark inactive members' 
      });
    }
  },

  /**
   * Get group activity status
   * GET /api/groups/:groupId/activity-status
   */
  async getGroupActivityStatus(req, res) {
    try {
      const { groupId } = req.params;

      const groupStatus = await groupActivityService.getGroupActivityStatus(groupId);

      res.status(200).json({
        success: true,
        data: groupStatus
      });
    } catch (error) {
      console.error('Error fetching group activity status:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch group activity status' 
      });
    }
  },

  /**
   * Get all groups activity status
   * GET /api/groups/activity-status
   */
  async getAllGroupsActivityStatus(req, res) {
    try {
      const { regionId } = req.query;

      const groupsStatus = await groupActivityService.getAllGroupsActivityStatus(regionId);

      res.status(200).json({
        success: true,
        data: groupsStatus
      });
    } catch (error) {
      console.error('Error fetching all groups activity status:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch groups activity status' 
      });
    }
  },

  /**
   * Check if user has permission to update member status
   * @param {Object} user - User object from auth middleware
   * @param {string} groupId - Group UUID
   * @returns {Promise<boolean>}
   */
  async checkMemberStatusPermission(user, groupId) {
    try {
      const knex = require('../db');
      
      // Super admin can do anything
      if (user.role === 'super admin') {
        return true;
      }

      // Regional manager can manage groups in their region
      if (user.role === 'region manager') {
        const group = await knex('groups')
          .where({ id: groupId })
          .first();
        
        return group && group.region_id === user.region_id;
      }

      // Group admin can manage their own group
      if (user.role === 'admin') {
        const group = await knex('groups')
          .where({ id: groupId, group_admin_id: user.id })
          .first();
        
        return !!group;
      }

      return false;
    } catch (error) {
      console.error('Error checking member status permission:', error);
      return false;
    }
  }
};
