const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const table = 'audit_logs';

module.exports = {
  async create(auditData) {
    const logEntry = {
      id: uuidv4(),
      ...auditData,
      created_at: new Date()
    };
    return db(table).insert(logEntry).returning('*');
  },

  async getById(id) {
    return db(table).where({ id }).first();
  },

  async getByUser(userId, limit = 50) {
    return db(table)
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  },

  async getByAction(action, limit = 100) {
    return db(table)
      .where({ action })
      .orderBy('created_at', 'desc')
      .limit(limit);
  },

  async getAll(limit = 100) {
    return db(table)
      .orderBy('created_at', 'desc')
      .limit(limit);
  },

  async getByDateRange(startDate, endDate) {
    return db(table)
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc');
  }
};
