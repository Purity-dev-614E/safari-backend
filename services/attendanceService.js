const { validate: uuidValidate } = require('uuid');
const attendanceModel = require('../models/attendanceModel');
const eventModel = require('../models/eventModel');
const userModel = require('../models/userModel');
const userGroupModel = require('../models/userGroupModel');
const knex = require('../db');

module.exports = {
  async createAttendance(attendanceData) {
    await ensureValidReferences(attendanceData.event_id, attendanceData.user_id);
    return attendanceModel.create(attendanceData);
  },
  
  async getAttendanceById(id) {
    return attendanceModel.getById(id);
  },
  
  async updateAttendance(id, attendanceData) {
    if (attendanceData.event_id || attendanceData.user_id) {
      const existing = await attendanceModel.getById(id);
      if (!existing) {
        const error = new Error('Attendance record not found');
        error.statusCode = 404;
        throw error;
      }
      await ensureValidReferences(
        attendanceData.event_id || existing.event_id,
        attendanceData.user_id || existing.user_id
      );
    }
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
    try{
    const startDate = calculateStartDate(period);
    return knex('attendance')
        .where('created_at', '>=', startDate)
        .andWhere('present', true)
        .select('*');
    }catch(error){
      console.error('Error fetching overall attendance by period:', error);
      throw new Error('Failed to fetch overall attendance by period');
    }
  }
};

async function ensureValidReferences(eventId, userId) {
  if (!uuidValidate(eventId) || !uuidValidate(userId)) {
    const error = new Error('event_id and user_id must be valid UUIDs');
    error.statusCode = 400;
    throw error;
  }

  const [event, user] = await Promise.all([
    eventModel.getById(eventId),
    userModel.getById(userId)
  ]);

  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (event.group_id) {
    const membership = await userGroupModel.getUserGroup(userId, event.group_id);
    if (!membership) {
      const error = new Error('User is not a member of the event group');
      error.statusCode = 400;
      throw error;
    }
  }
}

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