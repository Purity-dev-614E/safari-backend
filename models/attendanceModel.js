const db = require('../db');

const table = 'attendance';

module.exports = {
  async create(attendanceData) {
    return db(table).insert(attendanceData).returning('*');
  },
  
  async getById(id) {
    return db(table).where({ id }).first();
  },
  
  async update(id, attendanceData) {
    return db(table).where({ id }).update(attendanceData).returning('*');
  },
  
  async delete(id) {
    return db(table).where({ id }).del();
  },
  
  async getByEvent(eventId) {
    return db(table)
      .where({ event_id: eventId })
      .join('users', 'users.id', 'attendance.user_id')
      .select('attendance.*', 'users.full_name', 'users.email');
  },
  
  async getByUser(userId) {
    return db(table)
      .where({ user_id: userId })
      .join('events', 'events.id', 'attendance.event_id')
      .select('attendance.*', 'events.title', 'events.date');
  }
};
