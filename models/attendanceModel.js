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

  async getByTimePeriod(period) {
    let startDate;
    const now = new Date();

    switch (period) {
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        throw new Error('Invalid period. Must be weekly, monthly, or yearly');
    }

    return db(table)
      .where('attendance.created_at', '>=', startDate)
      .join('users', 'users.id', 'attendance.user_id')
      .join('events', 'events.id', 'attendance.event_id')
      .select('attendance.*', 'users.full_name', 'users.email', 'events.title', 'events.date');
  },

  async getByAttendedUsers(eventId) {
    return db(table)
      .where({ event_id: eventId, present: true }) // Filter only those marked as present
      .join('users', 'users.id', 'attendance.user_id')
      .select('users.id', 'users.full_name', 'users.email');
  },

  async getAttendanceStatus(eventId, userId) {
    return db(table)
      .where({ event_id: eventId, user_id: userId })
      .select('present')
      .first(); // Get only one record
  }
  
  
};
