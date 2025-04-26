const db = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

module.exports = {
  // Group-specific analytics for region
  async getGroupDemographicsForRegion(groupId) {
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
      
      // Get role distribution
      const roleDistribution = await db('users_groups')
        .join('users', 'users_groups.user_id', 'users.id')
        .where('users_groups.group_id', groupId)
        .select('users.role')
        .count('users.id as count')
        .groupBy('users.role');
      
      return {
        genderDistribution,
        roleDistribution
      };
    } catch (error) {
      console.error('Error fetching group demographics for region:', error);
      throw new Error('Failed to fetch group demographics for region');
    }
  },
  
  async getGroupAttendanceStatsForRegion(groupId) {
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
      console.error('Error fetching group attendance stats for region:', error);
      throw new Error('Failed to fetch group attendance stats for region');
    }
  },
  
  async getGroupGrowthAnalyticsForRegion(groupId) {
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
      console.error('Error fetching group growth analytics for region:', error);
      throw new Error('Failed to fetch group growth analytics for region');
    }
  },
  
  async compareGroupsInRegion(groupIds, regionId) {
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
        .where('region_id', regionId)
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
      console.error('Error comparing groups in region:', error);
      throw new Error('Failed to compare groups in region');
    }
  },
  
  async getEventParticipationStatsForRegion(eventId) {
    if (!uuidValidate(eventId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get event details
      const event = await db('events').where('id', eventId).first();
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Get all users in the group
      const groupMembers = await db('users_groups')
        .where('group_id', event.group_id)
        .join('users', 'users_groups.user_id', 'users.id')
        .select('users.id', 'users.full_name', 'users.email');
      
      // Get attendance records for this event
      const attendance = await db('attendance')
        .where('event_id', eventId)
        .select('user_id', 'present', 'notes');
      
      // Combine the data
      const participationStats = groupMembers.map(member => {
        const record = attendance.find(a => a.user_id === member.id);
        return {
          userId: member.id,
          userName: member.full_name,
          userEmail: member.email,
          present: record ? record.present : false,
          notes: record ? record.notes : null
        };
      });
      
      // Calculate summary statistics
      const totalMembers = participationStats.length;
      const presentMembers = participationStats.filter(p => p.present).length;
      const attendanceRate = totalMembers > 0 ? (presentMembers / totalMembers) * 100 : 0;
      
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        totalMembers,
        presentMembers,
        attendanceRate,
        participationDetails: participationStats
      };
    } catch (error) {
      console.error('Error fetching event participation stats for region:', error);
      throw new Error('Failed to fetch event participation stats for region');
    }
  },
  
  async compareEventAttendanceInRegion(eventIds, regionId) {
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
      // Get events details
      const events = await db('events')
        .whereIn('id', eventIds)
        .select('id', 'title', 'date', 'group_id');
      
      // Get attendance for each event
      const attendanceStats = await Promise.all(events.map(async (event) => {
        // Get total possible attendance
        const totalPossible = await db('users_groups')
          .where('group_id', event.group_id)
          .count('user_id as count')
          .first();
        
        // Get actual attendance
        const presentCount = await db('attendance')
          .where('event_id', event.id)
          .where('present', true)
          .count('id as count')
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
      
      return attendanceStats;
    } catch (error) {
      console.error('Error comparing event attendance in region:', error);
      throw new Error('Failed to compare event attendance in region');
    }
  },
  
  async getUserAttendanceTrendsForRegion(userId, regionId) {
    if (!uuidValidate(userId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get user details
      const user = await db('users').where('id', userId).first();
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get groups the user belongs to in this region
      const userGroups = await db('users_groups')
        .where('user_id', userId)
        .join('groups', 'users_groups.group_id', 'groups.id')
        .where('groups.region_id', regionId)
        .select('groups.id as group_id', 'groups.name as group_name');
      
      // Get all events for these groups
      const groupIds = userGroups.map(g => g.group_id);
      const events = await db('events')
        .whereIn('group_id', groupIds)
        .orderBy('date')
        .select('id', 'title', 'date', 'group_id');
      
      // Get attendance records for this user
      const attendance = await db('attendance')
        .where('user_id', userId)
        .whereIn('event_id', events.map(e => e.id))
        .select('event_id', 'present');
      
      // Combine the data
      const attendanceTrends = events.map(event => {
        const record = attendance.find(a => a.event_id === event.id);
        const group = userGroups.find(g => g.group_id === event.group_id);
        
        return {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          groupId: event.group_id,
          groupName: group ? group.group_name : 'Unknown Group',
          present: record ? record.present : false
        };
      });
      
      // Calculate summary statistics
      const totalEvents = attendanceTrends.length;
      const attendedEvents = attendanceTrends.filter(a => a.present).length;
      const attendanceRate = totalEvents > 0 ? (attendedEvents / totalEvents) * 100 : 0;
      
      // Group by month for trend analysis
      const monthlyStats = {};
      
      attendanceTrends.forEach(record => {
        const date = new Date(record.eventDate);
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
      const monthlyTrends = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
      
      return {
        userId: user.id,
        userName: user.full_name,
        totalEvents,
        attendedEvents,
        overallAttendanceRate: attendanceRate,
        attendanceRecords: attendanceTrends,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching user attendance trends for region:', error);
      throw new Error('Failed to fetch user attendance trends for region');
    }
  },
  
  async getOverallAttendanceByPeriodForRegion(period, regionId) {
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
      // Get all groups in this region
      const groups = await db('groups')
        .where('region_id', regionId)
        .select('id', 'name');
      
      // Get all events in the period for these groups
      const events = await db('events')
        .where('date', '>=', startDate)
        .whereIn('group_id', groups.map(g => g.id))
        .select('id', 'group_id');
      
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
        period,
        groupStats,
        overallStats
      };
    } catch (error) {
      console.error('Error fetching overall attendance by period for region:', error);
      throw new Error('Failed to fetch overall attendance by period for region');
    }
  },
  
  async getGroupDashboardDataForRegion(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get group details
      const group = await db('groups').where('id', groupId).first();
      if (!group) {
        throw new Error('Group not found');
      }
      
      // Get member count
      const memberCount = await db('users_groups')
        .where('group_id', groupId)
        .count('user_id as count')
        .first();
      
      // Get recent events
      const recentEvents = await db('events')
        .where('group_id', groupId)
        .orderBy('date', 'desc')
        .limit(5)
        .select('*');
      
      // Get upcoming events
      const now = new Date();
      const upcomingEvents = await db('events')
        .where('group_id', groupId)
        .where('date', '>=', now)
        .orderBy('date')
        .limit(5)
        .select('*');
      
      // Get attendance stats
      const attendanceStats = await this.getGroupAttendanceStatsForRegion(groupId);
      
      // Get growth analytics
      const growthAnalytics = await this.getGroupGrowthAnalyticsForRegion(groupId);
      
      return {
        groupId: group.id,
        groupName: group.name,
        memberCount: parseInt(memberCount.count),
        recentEvents,
        upcomingEvents,
        attendanceStats: attendanceStats.overallStats,
        growthAnalytics: {
          recentGrowth: growthAnalytics.cumulativeGrowth.slice(-3) // Last 3 months
        }
      };
    } catch (error) {
      console.error('Error fetching group dashboard data for region:', error);
      throw new Error('Failed to fetch group dashboard data for region');
    }
  },
  
  // Region-specific analytics
  async getRegionDemographics(regionId) {
    if (!uuidValidate(regionId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get gender distribution
      const genderDistribution = await db('users')
        .where('region_id', regionId)
        .select('gender')
        .count('id as count')
        .groupBy('gender');
      
      
  
      return {
        genderDistribution,
        
      };
    } catch (error) {
      console.error('Error fetching region demographics:', error);
      throw new Error('Failed to fetch region demographics');
    }
  },
  
  async getRegionAttendanceStats(regionId) {
    if (!uuidValidate(regionId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get all groups in this region
      const groups = await db('groups')
        .where('region_id', regionId)
        .select('id', 'name');
      
      // Get all events for these groups
      const events = await db('events')
        .whereIn('group_id', groups.map(g => g.id))
        .select('id', 'title', 'date', 'group_id');
      
      // Get attendance for each event
      const attendanceStats = await Promise.all(events.map(async (event) => {
        const totalMembers = await db('users_groups')
          .where('group_id', event.group_id)
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
          groupId: event.group_id,
          groupName: groups.find(g => g.id === event.group_id)?.name,
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
      console.error('Error fetching region attendance stats:', error);
      throw new Error('Failed to fetch region attendance stats');
    }
  },
  
  async getRegionGrowthAnalytics(regionId) {
    if (!uuidValidate(regionId)) {
      throw new Error('Invalid UUID format');
    }
    
    try {
      // Get all groups in this region
      const groups = await db('groups')
        .where('region_id', regionId)
        .select('id');
      
      // Get member join dates for all groups in this region
      const memberJoinDates = await db('users_groups')
        .whereIn('group_id', groups.map(g => g.id))
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
      console.error('Error fetching region growth analytics:', error);
      throw new Error('Failed to fetch region growth analytics');
    }
  },
  
  // Filter existing analytics methods by region
  async getAttendanceByPeriodForRegion(period, regionId) {
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
      // Get all groups in this region
      const groups = await db('groups')
        .where('region_id', regionId)
        .select('id');
      
      // Get all events in the period for these groups
      const events = await db('events')
        .where('date', '>=', startDate)
        .whereIn('group_id', groups.map(g => g.id))
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
      console.error('Error fetching attendance by period for region:', error);
      throw new Error('Failed to fetch attendance by period for region');
    }
  },
  
  async getDashboardSummaryForRegion(regionId) {
    try {
      // Get total users in region
      const userCount = await db('users')
        .where('region_id', regionId)
        .count('id as count')
        .first();
      
      // Get total groups in region
      const groupCount = await db('groups')
        .where('region_id', regionId)
        .count('id as count')
        .first();
      
      // Get all groups in this region
      const groups = await db('groups')
        .where('region_id', regionId)
        .select('id');
      
      // Get total events in region
      const eventCount = await db('events')
        .whereIn('group_id', groups.map(g => g.id))
        .count('id as count')
        .first();
      
      // Get recent events
      const recentEvents = await db('events')
        .whereIn('group_id', groups.map(g => g.id))
        .orderBy('date', 'desc')
        .limit(5)
        .select('*');
      
      // Get attendance stats
      const attendanceStats = await db('attendance')
        .join('events', 'attendance.event_id', 'events.id')
        .whereIn('events.group_id', groups.map(g => g.id))
        .where('attendance.present', true)
        .count('attendance.id as count')
        .first();
      
      return {
        userCount: parseInt(userCount.count),
        groupCount: parseInt(groupCount.count),
        eventCount: parseInt(eventCount.count),
        attendanceCount: parseInt(attendanceStats.count),
        recentEvents
      };
    } catch (error) {
      console.error('Error fetching dashboard summary for region:', error);
      throw new Error('Failed to fetch dashboard summary for region');
    }
  },
  
  async getMemberActivityStatusForRegion(regionId) {
    try {
      // Get current date and first day of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get all users in this region
      const users = await db('users')
        .where('region_id', regionId)
        .select('id', 'full_name', 'email');
      
      // Get all groups in this region
      const groups = await db('groups')
        .where('region_id', regionId)
        .select('id');
      
      // Get all events for the current month in this region
      const currentMonthEvents = await db('events')
        .where('date', '>=', firstDayOfMonth)
        .where('date', '<=', now)
        .whereIn('group_id', groups.map(g => g.id))
        .select('id', 'group_id', 'date');
      
      // Get activity status for each user
      const activityStats = await Promise.all(users.map(async (user) => {
        // Get user's groups
        const userGroups = await db('users_groups')
          .where('user_id', user.id)
          .whereIn('group_id', groups.map(g => g.id))
          .select('group_id');
        
        const userGroupIds = userGroups.map(g => g.group_id);
        
        // Get events for user's groups in the current month
        const userGroupEvents = currentMonthEvents.filter(event => 
          userGroupIds.includes(event.group_id)
        );
        
        const totalPossibleEvents = userGroupEvents.length;
        
        // Get user's attendance for these events
        let attendedEvents = 0;
        
        if (totalPossibleEvents > 0) {
          const attendance = await db('attendance')
            .where('user_id', user.id)
            .whereIn('event_id', userGroupEvents.map(e => e.id))
            .where('present', true)
            .count('id as count')
            .first();
          
          attendedEvents = parseInt(attendance.count);
        }
        
        // Calculate attendance rate
        const attendanceRate = totalPossibleEvents > 0 
          ? (attendedEvents / totalPossibleEvents) * 100 
          : 0;
        
        // Determine activity status based on 75% (3/4) threshold
        const isActive = attendanceRate >= 75;
        
        return {
          userId: user.id,
          userName: user.full_name,
          userEmail: user.email,
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
        userStats: activityStats,
        statusSummary: {
          Active: activeMembers.length,
          Inactive: inactiveMembers.length,
          Total: users.length
        }
      };
    } catch (error) {
      console.error('Error fetching member activity status for region:', error);
      throw new Error('Failed to fetch member activity status for region');
    }
  }
};