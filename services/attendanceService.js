const attendanceModel = require('../models/attendanceModel');
const knex = require('../db');

module.exports = {
  async createAttendance(attendanceData) {
    return attendanceModel.create(attendanceData);
  },
  
  async getAttendanceById(id) {
    return attendanceModel.getById(id);
  },
  
  async updateAttendance(id, attendanceData) {
    return attendanceModel.update(id, attendanceData);
  },
  
  async deleteAttendance(id) {
    return attendanceModel.delete(id);
  },
  
  async getAttendanceByEvent(eventId) {
    return attendanceModel.getByEvent(eventId);
  },
  
  async getAttendanceByUser(userId) {
    return attendanceModel.getByUser(userId);
  },

  async getAttendanceByTimePeriod(period) {
    return attendanceModel.getByTimePeriod(period);
  },

  async getByAttendedUsers(eventId){
    return attendanceModel.getByAttendedUsers(eventId);
  },

  async getAttendanceStatus(eventId, userId) {
    const attendance = await attendanceModel.getAttendanceStatus(eventId, userId);
    return attendance ? attendance.present : null; // Return true, false, or null if no record
  },

  // Fetch attendance by group and period
  async getAttendanceByGroupAndPeriod(groupId, period) {
    const startDate = calculateStartDate(period);
    return knex('attendance')
        .where('group_id', groupId)
        .andWhere('created_at', '>=', startDate)
        .select('*');
  },

  // Fetch overall attendance by period
  async getOverallAttendanceByPeriod(period) {
    const startDate = calculateStartDate(period);
    return knex('attendance')
        .where('created_at', '>=', startDate)
        .select('*');
  }
};

// Helper function to calculate the start date based on the period
function calculateStartDate(period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            throw new Error('Invalid period. Must be "week", "month", or "year".');
    }

    return startDate;
}