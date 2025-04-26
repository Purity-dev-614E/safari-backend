const db = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

module.exports = {
  // Group-specific analytics for admin
  async getGroupAttendanceByPeriod(groupId, period) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
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
        throw new Error('Invalid period. Must be week, month, or year');
    }
    
    try {
      // Get all events for this group in the period
      const events = await db('events')
        .where('group_id', groupId)
        .where('date', '>=', startDate)
        .select('id', 'title', 'date');
      
      // Get attendance for each event
      const attendanceStats = await Promise.all(events.map(async (event) => {
        const totalMembers = await db('users_groups')
          .where('group_id', groupId)
          .count('user_id as count')
          .first();
        
        const presentMembers = await db('attendance')
          .where('event_id', event.id)
          .where('present', true)
          .count('user_id as count')
          .first();
        
        return {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          totalMembers: parseInt(totalMembers.count),
          presentMembers: parseInt(presentMembers.count),
          attendanceRate: totalMembers.count > 0 
            ? (parseInt(presentMembers.count) / parseInt(totalMembers.count)) * 100 
            : 0
        };
      }));
      
      // Group by day
      const dailyStats = {};
      
      attendanceStats.forEach(stat => {
        const date = new Date(stat.eventDate);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            events: 0,
            totalMembers: 0,
            presentMembers: 0,
            attendanceRate: 0
          };
        }
        
        dailyStats[dateKey].events++;
        dailyStats[dateKey].totalMembers += stat.totalMembers;
        dailyStats[dateKey].presentMembers += stat.presentMembers;
        dailyStats[dateKey].attendanceRate = dailyStats[dateKey].totalMembers > 0 
          ? (dailyStats[dateKey].presentMembers / dailyStats[dateKey].totalMembers) * 100 
          : 0;
      });
      
      // Convert to array and sort by date
      const dailyStatsArray = Object.values(dailyStats).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      return {
        period,
        eventStats: attendanceStats,
        dailyStats: dailyStatsArray
      };
    } catch (error) {
      console.error('Error fetching group attendance by period:', error);
      throw new Error('Failed to fetch group attendance by period');
    }
  },
  
  async getGroupMemberParticipationStats(groupId, startDate, endDate) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Parse dates if provided
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          date: {
            '>=': new Date(startDate),
            '<=': new Date(endDate)
          }
        };
      } else if (startDate) {
        dateFilter = {
          date: {
            '>=': new Date(startDate)
          }
        };
      } else if (endDate) {
        dateFilter = {
          date: {
            '<=': new Date(endDate)
          }
        };
      }
      
      // Get all members of this group
      const members = await db('users_groups')
        .where('group_id', groupId)
        .join('users', 'users_groups.user_id', 'users.id')
        .select('users.id', 'users.full_name', 'users.email');
      
      // Get all events for this group with date filter
      const eventsQuery = db('events').where('group_id', groupId);
      
      if (dateFilter.date) {
        if (dateFilter.date['>=']) {
          eventsQuery.where('date', '>=', dateFilter.date['>=']);
        }
        if (dateFilter.date['<=']) {
          eventsQuery.where('date', '<=', dateFilter.date['<=']);
        }
      }
      
      const events = await eventsQuery.select('id', 'title', 'date');
      
      // Get participation stats for each member
      const memberStats = await Promise.all(members.map(async (member) => {
        // Get attendance records for this member
        const attendance = await db('attendance')
          .where('user_id', member.id)
          .whereIn('event_id', events.map(e => e.id))
          .select('event_id', 'present');
        
        const totalEvents = events.length;
        const attendedEvents = attendance.filter(a => a.present).length;
        const attendanceRate = totalEvents > 0 ? (attendedEvents / totalEvents) * 100 : 0;
        
        return {
          userId: member.id,
          userName: member.full_name,
          userEmail: member.email,
          totalEvents,
          attendedEvents,
          attendanceRate
        };
      }));
      
      // Sort by attendance rate (descending)
      memberStats.sort((a, b) => b.attendanceRate - a.attendanceRate);
      
      return {
        groupId,
        totalMembers: members.length,
        totalEvents: events.length,
        memberStats
      };
    } catch (error) {
      console.error('Error fetching group member participation stats:', error);
      throw new Error('Failed to fetch group member participation stats');
    }
  },
  
  async getGroupMemberActivityStatus(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get current date and first day of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get all members of this group
      const members = await db('users_groups')
        .where('group_id', groupId)
        .join('users', 'users_groups.user_id', 'users.id')
        .select('users.id', 'users.full_name', 'users.email');
      
      // Get all events for this group in the current month
      const events = await db('events')
        .where('group_id', groupId)
        .where('date', '>=', firstDayOfMonth)
        .where('date', '<=', now)
        .select('id', 'title', 'date');
      
      // Get activity status for each member
      const activityStats = await Promise.all(members.map(async (member) => {
        // Get attendance records for this member
        const attendance = await db('attendance')
          .where('user_id', member.id)
          .whereIn('event_id', events.map(e => e.id))
          .where('present', true)
          .count('id as count')
          .first();
        
        const totalPossibleEvents = events.length;
        const attendedEvents = parseInt(attendance.count);
        
        // Calculate attendance rate
        const attendanceRate = totalPossibleEvents > 0 
          ? (attendedEvents / totalPossibleEvents) * 100 
          : 0;
        
        // Determine activity status based on 75% threshold
        const isActive = attendanceRate >= 75;
        
        return {
          userId: member.id,
          userName: member.full_name,
          userEmail: member.email,
          totalPossibleEvents,
          attendedEvents,
          attendanceRate,
          activityStatus: isActive ? 'Active' : 'Inactive',
          activityThreshold: '75%'
        };
      }));
      
      // Group by activity status
      const activeMembers = activityStats.filter(user => user.activityStatus === 'Active');
      const inactiveMembers = activityStats.filter(user => user.activityStatus === 'Inactive');
      
      return {
        groupId,
        userStats: activityStats,
        statusSummary: {
          Active: activeMembers.length,
          Inactive: inactiveMembers.length,
          Total: members.length
        }
      };
    } catch (error) {
      console.error('Error fetching group member activity status:', error);
      throw new Error('Failed to fetch group member activity status');
    }
  }
};