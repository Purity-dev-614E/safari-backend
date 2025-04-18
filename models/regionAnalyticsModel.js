const db = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

module.exports = {
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
      
      // Get role distribution
      const roleDistribution = await db('users')
        .where('region_id', regionId)
        .select('role')
        .count('id as count')
        .groupBy('role');
      
      return {
        genderDistribution,
        roleDistribution
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
  }
};