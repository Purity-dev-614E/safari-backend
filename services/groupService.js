const groupModel = require('../models/groupModel');

const knex = require('../db');

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
    try {
      await knex('groups')
        .where({ id: groupId })
        .update({ group_admin_id: userId });
    } catch (error) {
      console.error('Error assigning admin to group:', error);
      throw new Error('Failed to assign admin to group');
    }
  },
  
  async getAllGroups() {
    return groupModel.getAll();
  },
  
  async getGroupMembers(groupId) {
    return groupModel.getGroupMembers(groupId);
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
  },
  
  async getAdminGroups(userId) {
    try {
      console.log(`Querying groups for admin userId: ${userId}`);
      const groups = await knex('groups').where({ group_admin_id: userId }).select('*');
      console.log(`Queried groups: ${JSON.stringify(groups)}`);
      return groups;
    } catch (error) {
      console.error('Error fetching admin groups:', error);
      throw new Error('Failed to fetch admin groups');
    }
  }
};