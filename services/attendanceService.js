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

  async getAttendanceByTimePeriod(period) {
    return attendanceModel.getByTimePeriod(period);
  },

  async getByAttendedUsers(eventId){
    return attendanceModel.getByAttendedUsers(eventId);
  },

  async getAttendanceStatus(eventId, userId) {
    const attendance = await attendanceModel.getAttendanceStatus(eventId, userId);
    return attendance ? attendance.present : null; // Return true, false, or null if no record
}


};
