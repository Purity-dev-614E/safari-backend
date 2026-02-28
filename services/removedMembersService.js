const RemovedMembersModel = require('../models/removedMembersModel');
const { createAuditLog } = require('./auditLogService');

class RemovedMembersService {
  /**
   * Remove a member from a group with reason
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID to remove
   * @param {string} reason - The reason for removal
   * @param {string} removedBy - The user ID performing the removal
   * @param {Object} performer - The user object performing the action
   * @returns {Promise<Object>} The removed member record
   */
  static async removeMember(groupId, userId, reason, removedBy, performer) {
    try {
      // Validate input
      if (!groupId || !userId || !reason || !removedBy) {
        throw new Error('Missing required fields: groupId, userId, reason, removedBy');
      }

      if (reason.trim().length < 3) {
        throw new Error('Reason must be at least 3 characters long');
      }

      // Check if user is already removed from this group
      const existingRemoval = await RemovedMembersModel.findByGroupAndUser(groupId, userId);
      if (existingRemoval) {
        // Return the existing removal record with a flag
        return {
          ...existingRemoval,
          alreadyRemoved: true,
          message: 'User was already removed from this group'
        };
      }

      // Create the removed member record
      const removedMember = await RemovedMembersModel.create({
        group_id: groupId,
        user_id: userId,
        reason: reason.trim(),
        removed_by: removedBy
      });

      // Create audit log
      await createAuditLog({
        actor_id: removedBy,
        user_id: userId,
        action: 'MEMBER_REMOVED',
        old_value: null,
        new_value: JSON.stringify({
          group_id: groupId,
          reason: reason.trim()
        }),
        metadata: {
          type: 'member_removal',
          group_id: groupId,
          removal_reason: reason.trim()
        }
      });

      return removedMember;
    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  /**
   * Get all removed members for a specific group
   * @param {string} groupId - The group ID
   * @param {Object} requester - The user requesting the data
   * @returns {Promise<Array>} Array of removed members
   */
  static async getGroupRemovedMembers(groupId, requester) {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      const removedMembers = await RemovedMembersModel.getByGroupId(groupId);
      
      // Format the response for frontend
      return removedMembers.map(member => ({
        id: member.id,
        user_id: member.user_id,
        full_name: member.full_name,
        email: member.email,
        reason: member.reason,
        removed_at: member.removed_at,
        removed_by_name: member.removed_by_name,
        removed_by_email: member.removed_by_email
      }));
    } catch (error) {
      throw new Error(`Failed to get removed members: ${error.message}`);
    }
  }

  /**
   * Get removal history for a specific user
   * @param {string} userId - The user ID
   * @param {Object} requester - The user requesting the data
   * @returns {Promise<Array>} Array of removal records
   */
  static async getUserRemovalHistory(userId, requester) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const removalHistory = await RemovedMembersModel.getByUserId(userId);
      
      return removalHistory.map(record => ({
        id: record.id,
        group_id: record.group_id,
        group_name: record.group_name,
        reason: record.reason,
        removed_at: record.removed_at,
        removed_by_name: record.removed_by_name,
        removed_by_email: record.removed_by_email
      }));
    } catch (error) {
      throw new Error(`Failed to get user removal history: ${error.message}`);
    }
  }

  /**
   * Get removal statistics for a group
   * @param {string} groupId - The group ID
   * @param {Object} requester - The user requesting the data
   * @returns {Promise<Object>} Statistics object
   */
  static async getGroupRemovalStats(groupId, requester) {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      return await RemovedMembersModel.getGroupStats(groupId);
    } catch (error) {
      throw new Error(`Failed to get removal statistics: ${error.message}`);
    }
  }

  /**
   * Get all removed members with pagination and filtering
   * @param {Object} options - Query options
   * @param {Object} requester - The user requesting the data
   * @returns {Promise<Object>} Paginated results
   */
  static async getAllRemovedMembers(options = {}, requester) {
    try {
      const {
        page = 1,
        limit = 10,
        groupId,
        userId,
        sortBy = 'removed_at',
        sortOrder = 'desc'
      } = options;

      // Apply role-based filtering
      let filteredOptions = { ...options };
      
      // If requester is regional manager, only show groups in their region
      if (requester.role === 'regional_manager' && requester.region_id) {
        // This would need to be implemented with region filtering
        // For now, we'll let it pass through
      }

      const result = await RemovedMembersModel.getAll(filteredOptions);
      
      // Format the data
      result.data = result.data.map(record => ({
        id: record.id,
        group_id: record.group_id,
        group_name: record.group_name,
        user_id: record.user_id,
        full_name: record.full_name,
        email: record.email,
        reason: record.reason,
        removed_at: record.removed_at,
        removed_by_name: record.removed_by_name,
        removed_by_email: record.removed_by_email
      }));

      return result;
    } catch (error) {
      throw new Error(`Failed to get removed members: ${error.message}`);
    }
  }

  /**
   * Restore a removed member (undo removal)
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID to restore
   * @param {Object} performer - The user performing the restoration
   * @returns {Promise<boolean>} Success status
   */
  static async restoreMember(groupId, userId, performer) {
    try {
      if (!groupId || !userId) {
        throw new Error('Group ID and User ID are required');
      }

      // Check if the user was actually removed
      const existingRemoval = await RemovedMembersModel.findByGroupAndUser(groupId, userId);
      if (!existingRemoval) {
        throw new Error('User was not removed from this group');
      }

      // Delete the removal record
      const deleted = await RemovedMembersModel.delete(groupId, userId);
      
      if (deleted === 0) {
        throw new Error('Failed to restore member');
      }

      // Create audit log
      await createAuditLog({
        actor_id: performer.id,
        user_id: userId,
        action: 'MEMBER_RESTORED',
        old_value: JSON.stringify({
          group_id: groupId,
          original_removal_reason: existingRemoval.reason,
          original_removed_at: existingRemoval.removed_at
        }),
        new_value: JSON.stringify({
          group_id: groupId,
          restored_at: new Date().toISOString()
        }),
        metadata: {
          type: 'member_restoration',
          group_id: groupId
        }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to restore member: ${error.message}`);
    }
  }

  /**
   * Check if a user can remove a member from a group
   * @param {Object} performer - The user performing the action
   * @param {string} groupId - The group ID
   * @returns {Promise<boolean>} Whether the user can remove members
   */
  static async canRemoveMember(performer, groupId) {
    // Root and Super Admin can remove from any group
    if (['root', 'super_admin'].includes(performer.role)) {
      return true;
    }

    // Regional Manager can remove from groups in their region
    if (performer.role === 'regional_manager') {
      // This would need to check if the group is in the manager's region
      // For now, we'll assume they can if they have a region_id
      return !!performer.region_id;
    }

    // Admin can remove from their own groups
    if (performer.role === 'admin') {
      // This would need to check if the user is an admin of the specific group
      // For now, we'll return false and let the middleware handle it
      return false;
    }

    // Regular users cannot remove members
    return false;
  }

  /**
   * Validate removal reason
   * @param {string} reason - The removal reason
   * @returns {Object} Validation result
   */
  static validateReason(reason) {
    const errors = [];

    if (!reason || typeof reason !== 'string') {
      errors.push('Reason is required and must be a string');
    } else {
      if (reason.trim().length < 3) {
        errors.push('Reason must be at least 3 characters long');
      }
      if (reason.trim().length > 500) {
        errors.push('Reason cannot exceed 500 characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = RemovedMembersService;
