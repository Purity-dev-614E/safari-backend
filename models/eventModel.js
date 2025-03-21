const db = require('../db');

const table = 'events';

module.exports = {
  async create(eventData) {
    return db(table).insert(eventData).returning('*');
  },
  
  async getById(id) {
    return db(table).where({ id }).first();
  },
  
  async update(id, eventData) {
    return db(table).where({ id }).update(eventData).returning('*');
  },
  
  async delete(id) {
    return db(table).where({ id }).del();
  },
  
  async getAll() {
    return db(table).select('*');
  },
  
  async getByGroup(groupId) {
    return db(table).where({ group_id: groupId }).select('*');
  }
};