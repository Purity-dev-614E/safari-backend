const db = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

module.exports = {
  // Group Analytics
  async getGroupDemographics(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get gender distribution
      const genderDistribution = await db('users_groups')
        .join('users', 'users_groups.user_id', 'users.id')
        .where('users_groups.group_id', groupId)
        .select('users.gender')
        .count('users.id as count')
        .groupBy('users.gender');
      
      // Get age distribution
      // const ageDistribution = await db('users_groups')
      //   .join('users', 'users_groups.user_id', 'users.id')
      //   .where('users_groups.group_id', groupId)
      //   .select(
      //     db.raw('CASE ' +
      //       'WHEN EXTRACT(YEAR FROM age(users.date_of_birth)) < 18 THEN \'Under 18\' ' +
      //       'WHEN EXTRACT(YEAR FROM age(users.date_of_birth)) BETWEEN 18 AND 25 THEN \'18-25\' ' +
      //       'WHEN EXTRACT(YEAR FROM age(users.date_of_birth)) BETWEEN 26 AND 35 THEN \'26-35\' ' +
      //       'WHEN EXTRACT(YEAR FROM age(users.date_of_birth)) BETWEEN 36 AND 50 THEN \'36-50\' ' +
      //       'ELSE \'Over 50\' ' +
      //       'END as age_group')
      //   )
      //   .count('users.id as count')
      //   .groupBy('age_group');
      
      // Get role distribution
      const roleDistribution = await db('users_groups')
        .join('users', 'users_groups.user_id', 'users.id')
        .where('users_groups.group_id', groupId)
        .select('users.role')
        .count('users.id as count')
        .groupBy('users.role');
      
      return {
        genderDistribution,
        // ageDistribution,
        roleDistribution
      };
    } catch (error) {
      console.error('Error fetching group demographics:', error);
      throw new Error('Failed to fetch group demographics');
    }
  },
  
  async getGroupAttendanceStats(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get all events for this group
      const events = await db('events')
        .where('group_id', groupId)
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
      
      // Calculate overall attendance rate
      const overallStats = attendanceStats.reduce((acc, curr) => {
        acc.totalEvents++;
        acc.totalMembers += curr.totalMembers;
        acc.presentMembers += curr.presentMembers;
        return acc;
      }, { totalEvents: 0, totalMembers: 0, presentMembers: 0 });
      
      overallStats.attendanceRate = overallStats.totalMembers > 0 
        ? (overallStats.presentMembers / overallStats.totalMembers) * 100 
        : 0;
      
      return {
        eventStats: attendanceStats,
        overallStats
      };
    } catch (error) {
      console.error('Error fetching group attendance stats:', error);
      throw new Error('Failed to fetch group attendance stats');
    }
  },
  
  async getGroupGrowthAnalytics(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get member join dates
      const memberJoinDates = await db('users_groups')
        .where('group_id', groupId)
        .join('users', 'users_groups.user_id', 'users.id')
        .select('users_groups.created_at as join_date')
        .orderBy('users_groups.created_at');
      
      // Group by month
      const monthlyGrowth = {};
      
      memberJoinDates.forEach(member => {
        const date = new Date(member.join_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyGrowth[monthKey]) {
          monthlyGrowth[monthKey] = 0;
        }
        
        monthlyGrowth[monthKey]++;
      });
      
      // Calculate cumulative growth
      const cumulativeGrowth = [];
      let cumulative = 0;
      
      Object.keys(monthlyGrowth).sort().forEach(month => {
        cumulative += monthlyGrowth[month];
        cumulativeGrowth.push({
          month,
          newMembers: monthlyGrowth[month],
          totalMembers: cumulative
        });
      });
      
      return {
        monthlyGrowth,
        cumulativeGrowth
      };
    } catch (error) {
      console.error('Error fetching group growth analytics:', error);
      throw new Error('Failed to fetch group growth analytics');
    }
  },
  
  async compareGroups(groupIds) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      throw new Error('Invalid group IDs');
    }
    
    // Validate all IDs
    groupIds.forEach(id => {
      if (!uuidValidate(id)) {
        throw new Error('Invalid UUID format');
      }
    });
    
    try {
      // Get basic info for each group
      const groups = await db('groups')
        .whereIn('id', groupIds)
        .select('id', 'name', 'created_at');
      
      // Get member count for each group
      const memberCounts = await Promise.all(groups.map(async (group) => {
        const count = await db('users_groups')
          .where('group_id', group.id)
          .count('user_id as count')
          .first();
        
        return {
          groupId: group.id,
          groupName: group.name,
          memberCount: parseInt(count.count)
        };
      }));
      
      // Get attendance rates for each group
      const attendanceRates = await Promise.all(groups.map(async (group) => {
        // Get all events for this group
        const events = await db('events')
          .where('group_id', group.id)
          .select('id');
        
        if (events.length === 0) {
          return {
            groupId: group.id,
            groupName: group.name,
            attendanceRate: 0
          };
        }
        
        // Get total possible attendance
        const totalPossibleAttendance = await db('users_groups')
          .where('group_id', group.id)
          .count('user_id as count')
          .first();
        
        const totalPossible = parseInt(totalPossibleAttendance.count) * events.length;
        
        // Get actual attendance
        const actualAttendance = await db('attendance')
          .whereIn('event_id', events.map(e => e.id))
          .where('present', true)
          .count('id as count')
          .first();
        
        const actual = parseInt(actualAttendance.count);
        
        return {
          groupId: group.id,
          groupName: group.name,
          attendanceRate: totalPossible > 0 ? (actual / totalPossible) * 100 : 0
        };
      }));
      
      return {
        memberCounts,
        attendanceRates
      };
    } catch (error) {
      console.error('Error comparing groups:', error);
      throw new Error('Failed to compare groups');
    }
  },
  
  // Attendance Analytics
  async getAttendanceByPeriod(period) {
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
      // Get all events in the period
      const events = await db('events')
        .where('date', '>=', startDate)
        .select('id', 'title', 'date', 'group_id');
      
      // Get attendance for each event
      const attendanceStats = await Promise.all(events.map(async (event) => {
        const totalPossible = await db('users_groups')
          .where('group_id', event.group_id)
          .count('user_id as count')
          .first();
        
        const presentCount = await db('attendance')
          .where('event_id', event.id)
          .where('present', true)
          .count('user_id as count')
          .first();
        
        return {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          totalPossible: parseInt(totalPossible.count),
          presentCount: parseInt(presentCount.count),
          attendanceRate: parseInt(totalPossible.count) > 0 
            ? (parseInt(presentCount.count) / parseInt(totalPossible.count)) * 100 
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
            totalPossible: 0,
            presentCount: 0,
            attendanceRate: 0
          };
        }
        
        dailyStats[dateKey].events++;
        dailyStats[dateKey].totalPossible += stat.totalPossible;
        dailyStats[dateKey].presentCount += stat.presentCount;
        dailyStats[dateKey].attendanceRate = dailyStats[dateKey].totalPossible > 0 
          ? (dailyStats[dateKey].presentCount / dailyStats[dateKey].totalPossible) * 100 
          : 0;
      });
      
      // Convert to array and sort by date
      const dailyStatsArray = Object.values(dailyStats).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      return {
        eventStats: attendanceStats,
        dailyStats: dailyStatsArray
      };
    } catch (error) {
      console.error('Error fetching attendance by period:', error);
      throw new Error('Failed to fetch attendance by period');
    }
  },
  
  async getOverallAttendanceByPeriod(period) {
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
      // Get all events in the period
      const events = await db('events')
        .where('date', '>=', startDate)
        .select('id', 'group_id');
      
      // Get all groups
      const groups = await db('groups')
        .select('id', 'name');
      
      // Calculate attendance for each group
      const groupStats = await Promise.all(groups.map(async (group) => {
        // Get events for this group
        const groupEvents = events.filter(e => e.group_id === group.id);
        
        if (groupEvents.length === 0) {
          return {
            groupId: group.id,
            groupName: group.name,
            eventCount: 0,
            totalPossible: 0,
            presentCount: 0,
            attendanceRate: 0
          };
        }
        
        // Get total possible attendance
        const totalPossible = await db('users_groups')
          .where('group_id', group.id)
          .count('user_id as count')
          .first();
        
        const totalPossibleAttendance = parseInt(totalPossible.count) * groupEvents.length;
        
        // Get actual attendance
        const actualAttendance = await db('attendance')
          .whereIn('event_id', groupEvents.map(e => e.id))
          .where('present', true)
          .count('id as count')
          .first();
        
        const actual = parseInt(actualAttendance.count);
        
        return {
          groupId: group.id,
          groupName: group.name,
          eventCount: groupEvents.length,
          totalPossible: totalPossibleAttendance,
          presentCount: actual,
          attendanceRate: totalPossibleAttendance > 0 ? (actual / totalPossibleAttendance) * 100 : 0
        };
      }));
      
      // Calculate overall stats
      const overallStats = groupStats.reduce((acc, curr) => {
        acc.eventCount += curr.eventCount;
        acc.totalPossible += curr.totalPossible;
        acc.presentCount += curr.presentCount;
        return acc;
      }, { eventCount: 0, totalPossible: 0, presentCount: 0 });
      
      overallStats.attendanceRate = overallStats.totalPossible > 0 
        ? (overallStats.presentCount / overallStats.totalPossible) * 100 
        : 0;
      
      return {
        groupStats,
        overallStats
      };
    } catch (error) {
      console.error('Error fetching overall attendance by period:', error);
      throw new Error('Failed to fetch overall attendance by period');
    }
  },
  
  async getUserAttendanceTrends(userId) {
    if (!uuidValidate(userId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get all attendance records for this user
      const attendanceRecords = await db('attendance')
        .where('user_id', userId)
        .join('events', 'attendance.event_id', 'events.id')
        .select('attendance.*', 'events.title', 'events.date')
        .orderBy('events.date');
      
      // Group by month
      const monthlyStats = {};
      
      attendanceRecords.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            totalEvents: 0,
            attendedEvents: 0,
            attendanceRate: 0
          };
        }
        
        monthlyStats[monthKey].totalEvents++;
        
        if (record.present) {
          monthlyStats[monthKey].attendedEvents++;
        }
        
        monthlyStats[monthKey].attendanceRate = 
          (monthlyStats[monthKey].attendedEvents / monthlyStats[monthKey].totalEvents) * 100;
      });
      
      // Convert to array and sort by month
      const monthlyStatsArray = Object.values(monthlyStats).sort((a, b) => 
        a.month.localeCompare(b.month)
      );
      
      return {
        attendanceRecords,
        monthlyStats: monthlyStatsArray
      };
    } catch (error) {
      console.error('Error fetching user attendance trends:', error);
      throw new Error('Failed to fetch user attendance trends');
    }
  },
  
  // Event Analytics
  async getEventParticipationStats(eventId) {
    if (!uuidValidate(eventId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get event details
      const event = await db('events')
        .where('id', eventId)
        .first();
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Get group members
      const groupMembers = await db('users_groups')
        .where('group_id', event.group_id)
        .count('user_id as count')
        .first();
      
      const totalPossible = parseInt(groupMembers.count);
      
      // Get attendance
      const attendance = await db('attendance')
        .where('event_id', eventId)
        .select('present')
        .count('id as count')
        .groupBy('present');
      
      let presentCount = 0;
      let absentCount = 0;
      
      attendance.forEach(record => {
        if (record.present) {
          presentCount = parseInt(record.count);
        } else {
          absentCount = parseInt(record.count);
        }
      });
      
      // Calculate attendance rate
      const attendanceRate = totalPossible > 0 ? (presentCount / totalPossible) * 100 : 0;
      
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        totalPossible,
        presentCount,
        absentCount,
        attendanceRate
      };
    } catch (error) {
      console.error('Error fetching event participation stats:', error);
      throw new Error('Failed to fetch event participation stats');
    }
  },
  
  async compareEventAttendance(eventIds) {
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      throw new Error('Invalid event IDs');
    }
    
    // Validate all IDs
    eventIds.forEach(id => {
      if (!uuidValidate(id)) {
        throw new Error('Invalid UUID format');
      }
    });
    
    try {
      // Get event details
      const events = await db('events')
        .whereIn('id', eventIds)
        .select('id', 'title', 'date', 'group_id');
      
      // Get attendance for each event
      const eventStats = await Promise.all(events.map(async (event) => {
        // Get group members
        const groupMembers = await db('users_groups')
          .where('group_id', event.group_id)
          .count('user_id as count')
          .first();
        
        const totalPossible = parseInt(groupMembers.count);
        
        // Get attendance
        const attendance = await db('attendance')
          .where('event_id', event.id)
          .select('present')
          .count('id as count')
          .groupBy('present');
        
        let presentCount = 0;
        let absentCount = 0;
        
        attendance.forEach(record => {
          if (record.present) {
            presentCount = parseInt(record.count);
          } else {
            absentCount = parseInt(record.count);
          }
        });
        
        // Calculate attendance rate
        const attendanceRate = totalPossible > 0 ? (presentCount / totalPossible) * 100 : 0;
        
        return {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          totalPossible,
          presentCount,
          absentCount,
          attendanceRate
        };
      }));
      
      return eventStats;
    } catch (error) {
      console.error('Error comparing event attendance:', error);
      throw new Error('Failed to compare event attendance');
    }
  },
  
  // Member Analytics
  async getMemberParticipationStats() {
    try {
      // Get all users
      const users = await db('users')
        .select('id', 'full_name', 'email');
      
      // Get participation stats for each user
      const participationStats = await Promise.all(users.map(async (user) => {
        // Get total events user could attend
        const userGroups = await db('users_groups')
          .where('user_id', user.id)
          .select('group_id');
        
        const groupIds = userGroups.map(g => g.group_id);
        
        const possibleEvents = await db('events')
          .whereIn('group_id', groupIds)
          .count('id as count')
          .first();
        
        const totalPossible = parseInt(possibleEvents.count);
        
        // Get actual attendance
        const attendance = await db('attendance')
          .where('user_id', user.id)
          .select('present')
          .count('id as count')
          .groupBy('present');
        
        let attendedCount = 0;
        let missedCount = 0;
        
        attendance.forEach(record => {
          if (record.present) {
            attendedCount = parseInt(record.count);
          } else {
            missedCount = parseInt(record.count);
          }
        });
        
        // Calculate participation rate
        const participationRate = totalPossible > 0 ? (attendedCount / totalPossible) * 100 : 0;
        
        return {
          userId: user.id,
          userName: user.full_name,
          userEmail: user.email,
          totalPossible,
          attendedCount,
          missedCount,
          participationRate
        };
      }));
      
      // Sort by participation rate (descending)
      participationStats.sort((a, b) => b.participationRate - a.participationRate);
      
      return participationStats;
    } catch (error) {
      console.error('Error fetching member participation stats:', error);
      throw new Error('Failed to fetch member participation stats');
    }
  },
  
  async getMemberRetentionStats() {
    try {
      // Get all users with join dates
      const users = await db('users')
        .select('id', 'full_name', 'email', 'created_at');
      
      // Get all attendance records
      const attendanceRecords = await db('attendance')
        .select('user_id', 'event_id', 'present', 'created_at')
        .join('events', 'attendance.event_id', 'events.id')
        .orderBy('events.date');
      
      // Group attendance by user
      const userAttendance = {};
      
      users.forEach(user => {
        userAttendance[user.id] = {
          userId: user.id,
          userName: user.full_name,
          userEmail: user.email,
          joinDate: user.created_at,
          attendanceRecords: []
        };
      });
      
      attendanceRecords.forEach(record => {
        if (userAttendance[record.user_id]) {
          userAttendance[record.user_id].attendanceRecords.push({
            eventId: record.event_id,
            present: record.present,
            date: record.created_at
          });
        }
      });
      
      // Calculate retention metrics
      const retentionStats = Object.values(userAttendance).map(user => {
        // Sort attendance records by date
        user.attendanceRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate first and last attendance
        const firstAttendance = user.attendanceRecords.length > 0 
          ? new Date(user.attendanceRecords[0].date) 
          : null;
        
        const lastAttendance = user.attendanceRecords.length > 0 
          ? new Date(user.attendanceRecords[user.attendanceRecords.length - 1].date) 
          : null;
        
        // Calculate attendance frequency
        const attendanceFrequency = user.attendanceRecords.length > 0 
          ? user.attendanceRecords.length / ((new Date() - new Date(user.joinDate)) / (1000 * 60 * 60 * 24 * 30)) 
          : 0;
        
        // Calculate retention status
        let retentionStatus = 'New';
        
        if (user.attendanceRecords.length === 0) {
          retentionStatus = 'Inactive';
        } else if (lastAttendance && (new Date() - lastAttendance) / (1000 * 60 * 60 * 24) < 30) {
          retentionStatus = 'Active';
        } else if (lastAttendance && (new Date() - lastAttendance) / (1000 * 60 * 60 * 24) < 90) {
          retentionStatus = 'At Risk';
        } else {
          retentionStatus = 'Churned';
        }
        
        return {
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          joinDate: user.joinDate,
          firstAttendance,
          lastAttendance,
          attendanceCount: user.attendanceRecords.length,
          attendanceFrequency,
          retentionStatus
        };
      });
      
      // Group by retention status
      const retentionByStatus = {
        Active: retentionStats.filter(user => user.retentionStatus === 'Active').length,
        'At Risk': retentionStats.filter(user => user.retentionStatus === 'At Risk').length,
        Churned: retentionStats.filter(user => user.retentionStatus === 'Churned').length,
        Inactive: retentionStats.filter(user => user.retentionStatus === 'Inactive').length,
        New: retentionStats.filter(user => user.retentionStatus === 'New').length
      };
      
      return {
        userStats: retentionStats,
        statusSummary: retentionByStatus
      };
    } catch (error) {
      console.error('Error fetching member retention stats:', error);
      throw new Error('Failed to fetch member retention stats');
    }
  },
  
  // Dashboard Analytics
  async getDashboardSummary() {
    try {
      // Get total users
      const totalUsers = await db('users')
        .count('id as count')
        .first();
      
      // Get total groups
      const totalGroups = await db('groups')
        .count('id as count')
        .first();
      
      // Get total events
      const totalEvents = await db('events')
        .count('id as count')
        .first();
      
      // Get recent events
      const recentEvents = await db('events')
        .orderBy('date', 'desc')
        .limit(5)
        .select('id', 'title', 'date');
      
      // Get upcoming events
      const upcomingEvents = await db('events')
        .where('date', '>=', new Date())
        .orderBy('date', 'asc')
        .limit(5)
        .select('id', 'title', 'date');
      
      // Get attendance rate for recent events
      const recentAttendance = await Promise.all(recentEvents.map(async (event) => {
        const totalPossible = await db('users_groups')
          .join('events', 'users_groups.group_id', 'events.group_id')
          .where('events.id', event.id)
          .count('users_groups.user_id as count')
          .first();
        
        const presentCount = await db('attendance')
          .where('event_id', event.id)
          .where('present', true)
          .count('user_id as count')
          .first();
        
        const attendanceRate = parseInt(totalPossible.count) > 0 
          ? (parseInt(presentCount.count) / parseInt(totalPossible.count)) * 100 
          : 0;
        
        return {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          attendanceRate
        };
      }));
      
      return {
        totalUsers: parseInt(totalUsers.count),
        totalGroups: parseInt(totalGroups.count),
        totalEvents: parseInt(totalEvents.count),
        recentEvents: recentAttendance,
        upcomingEvents
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw new Error('Failed to fetch dashboard summary');
    }
  },
  
  async getGroupDashboardData(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get group details
      const group = await db('groups')
        .where('id', groupId)
        .first();
      
      if (!group) {
        throw new Error('Group not found');
      }
      
      // Get member count
      const memberCount = await db('users_groups')
        .where('group_id', groupId)
        .count('user_id as count')
        .first();
      
      // Get event count
      const eventCount = await db('events')
        .where('group_id', groupId)
        .count('id as count')
        .first();
      
      // Get recent events
      const recentEvents = await db('events')
        .where('group_id', groupId)
        .orderBy('date', 'desc')
        .limit(5)
        .select('id', 'title', 'date');
      
      // Get upcoming events
      const upcomingEvents = await db('events')
        .where('group_id', groupId)
        .where('date', '>=', new Date())
        .orderBy('date', 'asc')
        .limit(5)
        .select('id', 'title', 'date');
      
      // Get attendance rate for recent events
      const recentAttendance = await Promise.all(recentEvents.map(async (event) => {
        const totalPossible = await db('users_groups')
          .where('group_id', groupId)
          .count('user_id as count')
          .first();
        
        const presentCount = await db('attendance')
          .where('event_id', event.id)
          .where('present', true)
          .count('user_id as count')
          .first();
        
        const attendanceRate = parseInt(totalPossible.count) > 0 
          ? (parseInt(presentCount.count) / parseInt(totalPossible.count)) * 100 
          : 0;
        
        return {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          attendanceRate
        };
      }));
      
      // Get top attendees
      const topAttendees = await db('attendance')
        .join('events', 'attendance.event_id', 'events.id')
        .join('users', 'attendance.user_id', 'users.id')
        .join('users_groups', 'users.id', 'users_groups.user_id')
        .where('users_groups.group_id', groupId)
        .where('attendance.present', true)
        .select('users.id', 'users.full_name', db.raw('COUNT(attendance.id) as attendance_count'))
        .groupBy('users.id', 'users.full_name')
        .orderBy('attendance_count', 'desc')
        .limit(5);
      
      return {
        groupId: group.id,
        groupName: group.name,
        memberCount: parseInt(memberCount.count),
        eventCount: parseInt(eventCount.count),
        recentEvents: recentAttendance,
        upcomingEvents,
        topAttendees
      };
    } catch (error) {
      console.error('Error fetching group dashboard data:', error);
      throw new Error('Failed to fetch group dashboard data');
    }
  }
}; 