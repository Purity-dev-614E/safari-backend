const db = require('../db');
const { getAttendanceByTimePeriod } = require('../services/attendanceService');

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
  },

  async getByTimePeriod(start, end) {
    return db(table)
      .whereBetween('date', [start, end])
      .join('users', 'users.id', 'attendance.user_id')
      .join('events', 'events.id', 'attendance.event_id')
      .select('attendance.*', 'users.full_name', 'users.email', 'events.title', 'events.date');
  }
};
