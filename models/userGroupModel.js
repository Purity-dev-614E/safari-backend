const db = require('../db');

module.exports = {
  async getUserGroup(userId, groupId) {
    return db('users_groups')
      .where({
        user_id: userId,
        group_id: groupId
      })
      .first();
  },
  
  async getUserGroups(userId) {
    return db('users_groups')
      .where('user_id', userId)
      .join('groups', 'users_groups.group_id', 'groups.id')
      .select(
        'groups.id',
        'groups.name',
        'groups.description',
        'groups.region_id',
        'users_groups.role',
        'users_groups.created_at as joined_at'
      );
  },
  
  async getGroupMembers(groupId) {
    return db('users_groups')
      .where('group_id', groupId)
      .join('users', 'users_groups.user_id', 'users.id')
      .select(
        'users.id',
        'users.full_name',
        'users.email',
        'users.profile_picture',
        'users_groups.role',
        'users_groups.created_at as joined_at'
      );
  },
  
  async isGroupAdmin(userId, groupId) {
    const userGroup = await this.getUserGroup(userId, groupId);
    return userGroup && userGroup.role === 'admin';
  }
};