const knex = require('../db');

module.exports = {
  async createGroup(groupData) {
    try {
      const result = await knex('groups').insert(groupData).returning('*');
      return result;
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  },

  async getGroupById(id) {
    try {
      const group = await knex('groups').where({ id }).first();
      return group;
    } catch (error) {
      console.error('Error fetching group by ID:', error);
      throw new Error('Failed to fetch group by ID');
    }
  },

  async getGroupByName(name, regionId) {
    try {
      // If regionId is provided, search for group with name in that region
      if (regionId) {
        const group = await knex('groups').where({ name, region_id: regionId }).first();
        return group;
      } else {
        // Otherwise, just search by name (for backward compatibility)
        const group = await knex('groups').where({ name }).first();
        return group;
      }
    } catch (error) {
      console.error('Error fetching group by name:', error);
      throw new Error('Failed to fetch group by name');
    }
  },

  async updateGroup(id, groupData) {
    try {
      const result = await knex('groups').where({ id }).update(groupData).returning('*');
      return result;
    } catch (error) {
      console.error('Error updating group:', error);
      throw new Error('Failed to update group');
    }
  },

  async deleteGroup(id) {
    try {
      const result = await knex('groups').where({ id }).del();
      return result;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  },

  async getAll() {
    try {
      const groups = await knex('groups').select('*');
      return groups;
    } catch (error) {
      console.error('Error fetching all groups:', error);
      throw new Error('Failed to fetch all groups');
    }
  },

  async getAllByRegion(regionId) {
    try {
      const groups = await knex('groups').where({ region_id: regionId }).select('*');
      return groups;
    } catch (error) {
      console.error('Error fetching groups by region:', error);
      throw new Error('Failed to fetch groups by region');
    }
  },

  async getGroupMembers(groupId) {
    try {
      const members = await knex('users_groups')
        .join('users', 'users_groups.user_id', 'users.id')
        .where('users_groups.group_id', groupId)
        .select('users.*');
      return members;
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw new Error('Failed to fetch group members');
    }
  },

  async addGroupMember(groupId, userId) {
    try {
      // Check if user and group are in the same region
      const user = await knex('users').where({ id: userId }).first();
      const group = await knex('groups').where({ id: groupId }).first();
      
      // if (user.region_id !== group.region_id && user.role !== 'super admin') {
      //   throw new Error('Cannot add user to a group in a different region');
      // }
      
      const result = await knex('users_groups').insert({ group_id: groupId, user_id: userId }).returning('*');
      return result;
    } catch (error) {
      console.error('Error adding group member:', error);
      throw new Error('Failed to add group member: ' + error.message);
    }
  },

  async removeGroupMember(groupId, userId) {
    try {
      await knex('users_groups').where({ group_id: groupId, user_id: userId }).del();
    } catch (error) {
      console.error('Error removing group member:', error);
      throw new Error('Failed to remove group member');
    }
  },

  async assignAdminToGroup(groupId, userId) {
    try {
      // Check if user and group are in the same region
      const user = await knex('users').where({ id: userId }).first();
      const group = await knex('groups').where({ id: groupId }).first();
      
      if (user.region_id !== group.region_id && user.role !== 'super admin') {
        throw new Error('Cannot assign admin from a different region');
      }
      
      await knex('groups').where({ id: groupId }).update({ group_admin_id: userId });
    } catch (error) {
      console.error('Error assigning admin to group:', error);
      throw new Error('Failed to assign admin to group: ' + error.message);
    }
  },

  async getAdminGroups(userId) {
    try {
      const groups = await knex('groups').where({ group_admin_id: userId }).select('*');
      return groups;
    } catch (error) {
      console.error('Error fetching admin groups:', error);
      throw new Error('Failed to fetch admin groups');
    }
  },

  async getGroupDemographics(groupId) {
    try {
      const demographics = await knex('users_groups')
        .join('users', 'users_groups.user_id', 'users.id')
        .join('groups', 'users_groups.group_id', 'groups.id')
        .select('groups.name as group_name', 'users.gender', 'users.role')
        .where('groups.id', groupId)
        .groupBy('groups.name', 'users.gender', 'users.role')
        .count('users.id as user_count');
      return demographics;
    } catch (error) {
      console.error('Error fetching group demographics:', error);
      throw new Error('Failed to fetch group demographics');
    }
  },

  async getGroupByUserId(userId) {
    try {
      const groups = await knex('users_groups')
        .join('groups', 'users_groups.group_id', 'groups.id')
        .where('users_groups.user_id', userId)
        .select('groups.*');
      return groups;
    } catch (error) {
      console.error('Error fetching groups by user ID:', error);
      throw new Error('Failed to fetch groups by user ID');
    }
  },

  async updateGroupRegion(id, regionId) {
    try {
      const result = await knex('groups')
        .where({ id })
        .update({ region_id: regionId })
        .returning('*');
      return result;
    } catch (error) {
      console.error('Error updating group region:', error);
      throw new Error('Failed to update group region');
    }
  }
};