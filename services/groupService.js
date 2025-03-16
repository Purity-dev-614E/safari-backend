const groupModel = require('../models/groupModel');

module.exports = {
  async createGroup(groupData) {
    return groupModel.create(groupData);
  },
  
  async getGroupById(id) {
    return groupModel.getById(id);
  },

  async getGroupByName(name){
    return groupModel.getByName(name);
  },
  
  async updateGroup(id, groupData) {
    return groupModel.update(id, groupData);
  },
  
  async deleteGroup(id) {
    return groupModel.delete(id);
  },

  async assignAdminToGroup(groupId, userId) {
    return groupModel.assignAdmin(groupId, userId);
  },
  
  async getAllGroups() {
    return groupModel.getAll();
  },
  
  async getGroupMembers(groupId) {
    return groupModel.getMembers(groupId);
  },
  
  async addGroupMember(groupId, userId) {
    return groupModel.addMember(groupId, userId);
  },
  
  async removeGroupMember(groupId, userId) {
    return groupModel.removeMember(groupId, userId);
  },

  async getGroupDemographics(groupId) {
    try {
      const demographics = await knex('users_groups')
        .join('users', 'users_groups.user_id', 'users.id')
        .join('groups', 'users_groups.group_id', 'groups.id')
        .select('groups.name as group_name', 'users.gender', 'users.role')
        .where('groups.id', groupId) // Filter by groupId
        .groupBy('groups.name', 'users.gender', 'users.role')
        .count('users.id as user_count');

      return demographics;
    } catch (error) {
      console.error('Error fetching group demographics:', error);
      throw new Error('Failed to fetch group demographics');
    }
  }

};
