// @ts-nocheck

const db = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const table = 'attendance';

module.exports = {
  async create(attendanceData) {
    return db(table).insert(attendanceData).returning('*');
  },
  
  async getById(id) {
    if (!uuidValidate(id)) {
      throw new Error('Invalid UUID format');
    }
    return db(table).where({ id }).first();
  },
  
  async update(id, attendanceData) {
    if (!uuidValidate(id)) {
      throw new Error('Invalid UUID format');
    }
    return db(table).where({ id }).update(attendanceData).returning('*');
  },
  
  async delete(id) {
    if (!uuidValidate(id)) {
      throw new Error('Invalid UUID format');
    }
    return db(table).where({ id }).del();
  },
  
  async getByEvent(eventId) {
    if (!uuidValidate(eventId)) {
      throw new Error('Invalid UUID format');
    }
    return db(table)
      .where({ event_id: eventId })
      .join('users', 'users.id', 'attendance.user_id')
      .select('attendance.*', 'users.full_name', 'users.email');
  },
  
  async getByUser(userId) {
    if (!uuidValidate(userId)) {
      throw new Error('Invalid UUID format');
    }
    return db(table)
      .where({ user_id: userId })
      .join('events', 'events.id', 'attendance.event_id')
      .select('attendance.*', 'events.title', 'events.date');
  },

  async getByTimePeriod(period) {
    let startDate;
    const now = new Date();

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
        throw new Error('Invalid period. Must be weekly, monthly, or yearly');
    }

    return db(table)
      .where('attendance.created_at', '>=', startDate)
      .join('users', 'users.id', 'attendance.user_id')
      .join('events', 'events.id', 'attendance.event_id')
      .select('attendance.*', 'users.full_name', 'users.email', 'events.title', 'events.date');
  },

  async getByAttendedUsers(eventId) {
    if (!uuidValidate(eventId)) {
      throw new Error('Invalid UUID format');
    }
    return db(table)
      .where({ event_id: eventId, present: true }) // Filter only those marked as present
      .join('users', 'users.id', 'attendance.user_id')
      .select('users.id', 'users.full_name', 'users.email');
  },

  async getAttendanceStatus(eventId, userId) {
    if (!uuidValidate(eventId) || !uuidValidate(userId)) {
      throw new Error('Invalid UUID format');
    }
    return db(table)
      .where({ event_id: eventId, user_id: userId })
      .select('present')
      .first();
  },

  //get attendance
  async getAttendancePercentage(groupId) {
  if (!uuidValidate(groupId)) {
    throw new Error('Invalid UUID format');
  }

  const result = await db('attendance')
    .join('events', 'attendance.event_id', 'events.id')
    .where('events.group_id', groupId)
    .andWhere('attendance.present', true)
    .countDistinct('attendance.user_id as presentCount')
    .first();

  const totalMembers = await db('users_groups')
    .where('group_id', groupId)
    .countDistinct('user_id as memberCount')
    .first();

  const presentCount = parseInt(result.presentCount, 10) || 0;
  const memberCount = parseInt(totalMembers.memberCount, 10) || 0;

  const percentage = memberCount > 0 ? (presentCount / memberCount) * 100 : 0;

  return {
    presentCount,
    memberCount,
    percentage: percentage.toFixed(2),
    };
  },

  async getLeadershipAttendees(userRole, userRegionId, userTle) {
    // Build the base query for leadership events
    let query = db('events')
      .where('events.tag', 'leadership')
      .andWhere(function() {
        // Type 1: user is RM or group admin
        this.where('events.target_audience', 'all')
          .andWhere('events.regional_id', userRegionId)
          .andWhere(function() {
            this.where('users.role', 'regional manager')
              .orWhere('users.role', 'admin');
          });
      })
      .orWhere(function() {
        // Type 2: user is RM only
        this.where('events.target_audience', 'rc_only')
          .andWhere('users.role', 'regional manager');
      })
      .orWhere(function() {
        // Type 3: user is group admin in the matching region
        this.where('events.target_audience', 'regional')
          .andWhere('users.role', 'admin')
          .andWhere('events.regional_id', userRegionId);
      })
      .orWhere(function() {
        // Type 3 also visible to the RM of that region
        this.where('events.target_audience', 'regional')
          .andWhere('users.role', 'regional manager')
          .andWhere('events.regional_id', userRegionId);
      });

    // Join with attendance to get attendees
    const attendees = await db('attendance')
      .join('events', 'attendance.event_id', 'events.id')
      .join('users', 'attendance.user_id', 'users.id')
      .where('events.tag', 'leadership')
      .andWhere(function() {
        // Type 1: user is RM or group admin
        this.where('events.target_audience', 'all')
          .andWhere(function() {
            this.where('users.role', 'regional manager')
              .orWhere('users.role', 'admin');
          });
      })
      .orWhere(function() {
        // Type 2: user is RM only
        this.where('events.target_audience', 'rc_only')
          .andWhere('users.role', 'regional manager');
      })
      .orWhere(function() {
        // Type 3: user is group admin in the matching region
        this.where('events.target_audience', 'regional')
          .andWhere('users.role', 'admin')
          .andWhere('events.regional_id', userRegionId);
      })
      .orWhere(function() {
        // Type 3 also visible to the RM of that region
        this.where('events.target_audience', 'regional')
          .andWhere('users.role', 'regional manager')
          .andWhere('events.regional_id', userRegionId);
      })
      .andWhere('users.user_tle', 'in', userTle)
      .select(
        'attendance.id as attendance_id',
        'attendance.present',
        'attendance.created_at as attendance_created_at',
        'events.id as event_id',
        'events.title as event_title',
        'events.date as event_date',
        'events.target_audience',
        'events.regional_id',
        'users.id as user_id',
        'users.full_name',
        'users.email',
        'users.role',
        'users.user_tle'
      );

    return attendees;
  }

};