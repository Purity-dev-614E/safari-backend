const auditLogModel = require('../models/auditLogModel');

module.exports = {
  async logRoleChange(actorId, targetUserId, oldRole, newRole, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        actor_id: actorId,
        user_id: targetUserId,
        action: 'ROLE_CHANGE',
        old_value: oldRole,
        new_value: newRole,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'role_change'
        })
      };

      return await auditLogModel.create(auditData);
    } catch (error) {
      console.error('Failed to log role change:', error);
      // Don't throw error to avoid breaking the main operation
    }
  },

  async logUserCreation(actorId, userId, role, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        actor_id: actorId,
        user_id: userId,
        action: 'USER_CREATION',
        new_value: role,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'user_creation'
        })
      };

      return await auditLogModel.create(auditData);
    } catch (error) {
      console.error('Failed to log user creation:', error);
    }
  },

  async logUserDeletion(actorId, targetUserId, role, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        actor_id: actorId,
        user_id: targetUserId,
        action: 'USER_DELETION',
        old_value: role,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'user_deletion'
        })
      };

      return await auditLogModel.create(auditData);
    } catch (error) {
      console.error('Failed to log user deletion:', error);
    }
  },

  async logGroupCreation(actorId, groupId, groupName, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        actor_id: actorId,
        action: 'GROUP_CREATION',
        target_id: groupId,
        new_value: groupName,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'group_creation'
        })
      };

      return await auditLogModel.create(auditData);
    } catch (error) {
      console.error('Failed to log group creation:', error);
    }
  },

  async logGroupDeletion(actorId, groupId, groupName, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        actor_id: actorId,
        action: 'GROUP_DELETION',
        target_id: groupId,
        old_value: groupName,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'group_deletion'
        })
      };

      return await auditLogModel.create(auditData);
    } catch (error) {
      console.error('Failed to log group deletion:', error);
    }
  },

  async logRegionCreation(actorId, regionId, regionName, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        actor_id: actorId,
        action: 'REGION_CREATION',
        target_id: regionId,
        new_value: regionName,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'region_creation'
        })
      };

      return await auditLogModel.create(auditData);
    } catch (error) {
      console.error('Failed to log region creation:', error);
    }
  },

  async logRegionDeletion(actorId, regionId, regionName, ipAddress = null, userAgent = null) {
    try {
      const auditData = {
        actor_id: actorId,
        action: 'REGION_DELETION',
        target_id: regionId,
        old_value: regionName,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'region_deletion'
        })
      };

      return await auditLogModel.create(auditData);
    } catch (error) {
      console.error('Failed to log region deletion:', error);
    }
  },

  async getAuditLogs(limit = 100) {
    return await auditLogModel.getAll(limit);
  },

  async getUserAuditLogs(userId, limit = 50) {
    return await auditLogModel.getByUser(userId, limit);
  },

  async getRoleChangeLogs(limit = 100) {
    return await auditLogModel.getByAction('ROLE_CHANGE', limit);
  }
};
