const db = require('../db');

const table = 'groups';

module.exports = {
  async create(groupData) {
    return db(table).insert(groupData).returning('*');
  },
  
  async getById(id) {
    return db(table).where({ id }).first();
  },
  
  async update(id, groupData) {
    return db(table).where({ id }).update(groupData).returning('*');
  },
  
  async delete(id) {
    return db(table).where({ id }).del();
  },
  
  async getAll() {
    return db(table).select('*');
  },

  async assignAdmin(groupId, userId) {
    return db('users_groups').insert({
      user_id: userId,
      group_id: groupId,
      role: 'admin' // Assuming you have a role column in the users_groups table
    }).returning('*');
  },
  
  async getMembers(groupId) {
    return db('users_groups')
      .where({ group_id: groupId })
      .join('users', 'users.id', 'users_groups.user_id')
      .select('users.*');
  },
  
  async addMember(groupId, userId) {
    return db('users_groups').insert({
      user_id: userId,
      group_id: groupId
    }).returning('*');
  },
  
  async removeMember(groupId, userId) {
    return db('users_groups')
      .where({ group_id: groupId, user_id: userId })
      .del();
  }
};
