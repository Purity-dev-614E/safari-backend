const attendanceModel = require('../models/attendanceModel');

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

  async getAttendanceByTimePeriod(start, end) {
    return attendanceModel.getByTimePeriod(start, end);
  }
};
