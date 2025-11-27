const db = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

const ATTENDANCE_OVERVIEW_PERIODS = {
  week: {
    bucketCount: 7,
    step: { days: 1 },
    labelFormatter: (bucket) => DAY_FORMATTER.format(bucket.startDate),
  },
  month: {
    bucketCount: 4,
    step: { days: 7 },
    labelFormatter: (_, index) => `Week ${index + 1}`,
  },
  quarter: {
    bucketCount: 4,
    step: { months: 1 },
    labelFormatter: (bucket) => MONTH_FORMATTER.format(bucket.startDate),
  },
  year: {
    bucketCount: 12,
    step: { months: 1 },
    labelFormatter: (bucket) => MONTH_FORMATTER.format(bucket.startDate),
  },
};

function normalizeOverviewPeriod(period) {
  const key = typeof period === 'string' ? period.trim().toLowerCase() : '';
  return PERIOD_ALIASES[key] || key;
}

function buildAttendanceBuckets(config) {
  const buckets = [];
  let bucketEnd = new Date();

  for (let i = 0; i < config.bucketCount; i++) {
    const startDate = shiftDateBackward(bucketEnd, config.step);
    buckets.unshift({
      startDate,
      endDate: new Date(bucketEnd),
      eventCount: 0,
      totalPossible: 0,
      presentCount: 0,
      attendanceRate: 0,
    });
    bucketEnd = new Date(startDate);
  }

  return buckets.map((bucket, index) => ({
    ...bucket,
    label: config.labelFormatter(bucket, index),
  }));
}

function shiftDateBackward(date, step) {
  const result = new Date(date);

  if (step.years) {
    result.setFullYear(result.getFullYear() - step.years);
  }
  if (step.months) {
    result.setMonth(result.getMonth() - step.months);
  }
  if (step.weeks) {
    result.setDate(result.getDate() - step.weeks * 7);
  }
  if (step.days) {
    result.setDate(result.getDate() - step.days);
  }

  return result;
}

function findBucketForDate(buckets, rawDate) {
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate);

  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    const isLastBucket = i === buckets.length - 1;
    const startsAfter = date >= bucket.startDate;
    const endsBefore = isLastBucket ? date <= bucket.endDate : date < bucket.endDate;

    if (startsAfter && endsBefore) {
      return bucket;
    }
  }

  return null;
}

function formatAttendanceOverviewResponse(scope, scopeId, period, buckets) {
  const summary = buckets.reduce(
    (acc, bucket) => {
      acc.eventCount += bucket.eventCount;
      acc.totalPossible += bucket.totalPossible;
      acc.presentCount += bucket.presentCount;
      return acc;
    },
    { eventCount: 0, totalPossible: 0, presentCount: 0 }
  );

  summary.attendanceRate = summary.totalPossible > 0
    ? (summary.presentCount / summary.totalPossible) * 100
    : 0;

  return {
    scope,
    scopeId: scopeId || null,
    period,
    buckets: buckets.map(bucket => ({
      label: bucket.label,
      startDate: bucket.startDate.toISOString(),
      endDate: bucket.endDate.toISOString(),
      eventCount: bucket.eventCount,
      totalPossible: bucket.totalPossible,
      presentCount: bucket.presentCount,
      attendanceRate: Number(bucket.attendanceRate.toFixed(2)),
    })),
    summary: {
      eventCount: summary.eventCount,
      totalPossible: summary.totalPossible,
      presentCount: summary.presentCount,
      attendanceRate: Number(summary.attendanceRate.toFixed(2)),
    },
  };
}

const PERIOD_ALIASES = {
  weekly: 'week',
  week: 'week',
  monthly: 'month',
  month: 'month',
  quarterly: 'quarter',
  quarter: 'quarter',
  yearly: 'year',
  year: 'year',
};

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
    // Fetch total group members ONCE
    const totalMembersResult = await db('users_groups')
      .where('group_id', groupId)
      .count('user_id as count')
      .first();

    const totalMembers = Number(totalMembersResult.count);

    // Fetch all events for this group
    const events = await db('events')
      .where('group_id', groupId)
      .select('id', 'title', 'date');

    // For each event, calculate attendance stats
    const eventStats = await Promise.all(events.map(async (event) => {

      // Count present members
      const presentResult = await db('attendance')
        .where('event_id', event.id)
        .where('present', true)
        .count('user_id as count')
        .first();

      const presentMembers = Number(presentResult.count);

      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        totalMembers,
        presentMembers,
        attendanceRate: totalMembers > 0 
          ? (presentMembers / totalMembers) * 100 
          : 0
      };
    }));

    // Compute overall statistics correctly
    const totalPresent = eventStats.reduce((sum, e) => sum + e.presentMembers, 0);

    const overallStats = {
      totalEvents: events.length,
      totalMembers,
      totalPresentMembers: totalPresent,
      averageAttendanceRate: events.length > 0
        ? (totalPresent / (totalMembers * events.length)) * 100
        : 0
    };

    return { eventStats, overallStats };

  } catch (error) {
    console.error("Error fetching group attendance stats:", error);
    throw new Error("Failed to fetch group attendance stats");
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
  
  ////Super admin
 async getOverallAttendanceByPeriod(period) {
  const now = new Date();
  let startDate = new Date(now); // clone, DO NOT mutate original

  // Calculate start date without mutating `now`
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      throw new Error('Invalid period. Must be week, month, or year');
  }

  try {
    // Get all events in selected period
    const events = await db('events')
      .where('date', '>=', startDate)
      .select('id', 'date');

    // Get total possible attendance (all groups combined)
    const groups = await db('groups').select('id');
    const groupUserCounts = await Promise.all(
      groups.map(async g =>
        db('users_groups')
          .where('group_id', g.id)
          .count('user_id as count')
          .first()
      )
    );

    const totalMembers = groupUserCounts.reduce((acc, row) => acc + parseInt(row.count), 0);
    const totalPossibleAttendance = totalMembers * events.length;

    // Get actual attendance
    const actualAttendance = await db('attendance')
      .whereIn('event_id', events.map(e => e.id))
      .where('present', true)
      .count('id as count')
      .first();

    const presentCount = parseInt(actualAttendance.count);
    const attendanceRate = totalPossibleAttendance > 0
      ? (presentCount / totalPossibleAttendance) * 100
      : 0;

    // WEEKLY BREAKDOWN
    const weeklyMap = {};

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const week = `${eventDate.getFullYear()}-W${Math.ceil(eventDate.getDate() / 7)}`;

      weeklyMap[week] = (weeklyMap[week] || { total: 0, present: 0 });
      weeklyMap[week].total += totalMembers;
    });

    const weeklyAttendance = await db('attendance')
      .whereIn('event_id', events.map(e => e.id))
      .where('present', true)
      .select('event_id');

    weeklyAttendance.forEach(row => {
      const evt = events.find(e => e.id === row.event_id);
      const d = new Date(evt.date);
      const week = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      weeklyMap[week].present += 1;
    });

    const weeklyBreakdown = Object.entries(weeklyMap).map(([week, data]) => ({
      week,
      attendanceRate: data.total > 0 ? (data.present / data.total) * 100 : 0
    }));

    // MONTHLY BREAKDOWN
    const monthlyMap = {};

    events.forEach(event => {
      const d = new Date(event.date);
      const month = d.toLocaleString('default', { month: 'long' });

      monthlyMap[month] = (monthlyMap[month] || { total: 0, present: 0 });
      monthlyMap[month].total += totalMembers;
    });

    monthlyAttendance = weeklyAttendance; // reuse
    monthlyAttendance.forEach(row => {
      const evt = events.find(e => e.id === row.event_id);
      const d = new Date(evt.date);
      const month = d.toLocaleString('default', { month: 'long' });
      monthlyMap[month].present += 1;
    });

    const monthlyBreakdown = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      attendanceRate: data.total > 0 ? (data.present / data.total) * 100 : 0
    }));

    return {
      overallStats: {
        eventCount: events.length,
        totalPossible: totalPossibleAttendance,
        presentCount,
        attendanceRate
      },
      weeklyBreakdown,
      monthlyBreakdown
    };
  } catch (err) {
    console.error(err);
    throw new Error('Failed to fetch attendance data');
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
  async getMemberParticipationStats(startDate, endDate) {
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
        
        // Build query for possible events
        let eventsQuery = db('events').whereIn('group_id', groupIds);
        
        // Add date filters if provided
        if (startDate) {
          eventsQuery = eventsQuery.where('date', '>=', new Date(startDate));
        }
        if (endDate) {
          eventsQuery = eventsQuery.where('date', '<=', new Date(endDate));
        }
        
        const possibleEvents = await eventsQuery.count('id as count').first();
        const totalPossible = parseInt(possibleEvents.count);
        
        // Get event IDs for attendance query
        let eventIdsQuery = db('events').whereIn('group_id', groupIds);
        if (startDate) {
          eventIdsQuery = eventIdsQuery.where('date', '>=', new Date(startDate));
        }
        if (endDate) {
          eventIdsQuery = eventIdsQuery.where('date', '<=', new Date(endDate));
        }
        const eventIds = await eventIdsQuery.select('id');
        
        // Get actual attendance
        const attendance = await db('attendance')
          .where('user_id', user.id)
          .whereIn('event_id', eventIds.map(e => e.id))
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
  
  async getMemberParticipationStatsForRegion(regionId, startDate, endDate) {
    try {
      // Get all users in this region
      const users = await db('users')
        .where('region_id', regionId)
        .select('id', 'full_name', 'email');
      
      // Get all groups in this region
      const groups = await db('groups')
        .where('region_id', regionId)
        .select('id');
      
      const groupIds = groups.map(g => g.id);
      
      // Get participation stats for each user
      const participationStats = await Promise.all(users.map(async (user) => {
        // Get user's groups in this region
        const userGroups = await db('users_groups')
          .where('user_id', user.id)
          .whereIn('group_id', groupIds)
          .select('group_id');
        
        const userGroupIds = userGroups.map(g => g.group_id);
        
        // Build query for possible events
        let eventsQuery = db('events').whereIn('group_id', userGroupIds);
        
        // Add date filters if provided
        if (startDate) {
          eventsQuery = eventsQuery.where('date', '>=', new Date(startDate));
        }
        if (endDate) {
          eventsQuery = eventsQuery.where('date', '<=', new Date(endDate));
        }
        
        const possibleEvents = await eventsQuery.count('id as count').first();
        const totalPossible = parseInt(possibleEvents.count);
        
        // Get event IDs for attendance query
        let eventIdsQuery = db('events').whereIn('group_id', userGroupIds);
        if (startDate) {
          eventIdsQuery = eventIdsQuery.where('date', '>=', new Date(startDate));
        }
        if (endDate) {
          eventIdsQuery = eventIdsQuery.where('date', '<=', new Date(endDate));
        }
        const eventIds = await eventIdsQuery.select('id');
        
        // Get actual attendance
        const attendance = await db('attendance')
          .where('user_id', user.id)
          .whereIn('event_id', eventIds.map(e => e.id))
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
      console.error('Error fetching member participation stats for region:', error);
      throw new Error('Failed to fetch member participation stats for region');
    }
  },
  
  async getMemberRetentionStats() {
    try {
      // Get all users with join dates
      const users = await db('users')
        .select('id', 'full_name', 'email', 'created_at');
      
      // Get all attendance records
      const attendanceRecords = await db('attendance')
        .select('user_id', 'event_id', 'present', 'attendance.created_at')
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
  
  async getMemberActivityStatus() {
    try {
      // Get current date and first day of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get all users
      const users = await db('users')
        .select('id', 'full_name', 'email');
      
      // Get all events for the current month
      const currentMonthEvents = await db('events')
        .where('date', '>=', firstDayOfMonth)
        .where('date', '<=', now)
        .select('id', 'group_id', 'date');
      
      // Get activity status for each user
      const activityStats = await Promise.all(users.map(async (user) => {
        // Get user's groups
        const userGroups = await db('users_groups')
          .where('user_id', user.id)
          .select('group_id');
        
        const groupIds = userGroups.map(g => g.group_id);
        
        // Get events for user's groups in the current month
        const userGroupEvents = currentMonthEvents.filter(event => 
          groupIds.includes(event.group_id)
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
      console.error('Error fetching member activity status:', error);
      throw new Error('Failed to fetch member activity status');
    }
  },

  async getAttendanceOverview(period, { scope = 'overall', scopeId } = {}) {
    const normalizedPeriod = normalizeOverviewPeriod(period);
    const config = ATTENDANCE_OVERVIEW_PERIODS[normalizedPeriod];

    if (!config) {
      throw new Error('Invalid period. Supported options: week, month, quarter, year');
    }

    if (!['overall', 'region', 'group'].includes(scope)) {
      throw new Error('Invalid scope. Supported options: overall, region, group');
    }

    if (scope === 'group' && !scopeId) {
      throw new Error('groupId is required when scope is group');
    }

    if (scope === 'region' && !scopeId) {
      throw new Error('regionId is required when scope is region');
    }

    const buckets = buildAttendanceBuckets(config);
    const rangeStart = buckets[0].startDate;
    const rangeEnd = buckets[buckets.length - 1].endDate;

    let eventsQuery = db('events')
      .select('events.id', 'events.group_id', 'events.date')
      .where('events.date', '>=', rangeStart)
      .andWhere('events.date', '<=', rangeEnd);

    if (scope === 'group') {
      eventsQuery = eventsQuery.where('events.group_id', scopeId);
    } else if (scope === 'region') {
      eventsQuery = eventsQuery
        .join('groups', 'events.group_id', 'groups.id')
        .where('groups.region_id', scopeId)
        .select('events.id', 'events.group_id', 'events.date');
    }

    const events = await eventsQuery;

    if (events.length === 0) {
      return formatAttendanceOverviewResponse(scope, scopeId, normalizedPeriod, buckets);
    }

    const eventIds = events.map(event => event.id);
    const groupIds = [...new Set(events.map(event => event.group_id))];

    const attendanceRows = eventIds.length
      ? await db('attendance')
          .whereIn('event_id', eventIds)
          .andWhere('present', true)
          .select('event_id')
          .count('id as presentCount')
          .groupBy('event_id')
      : [];

    const attendanceMap = new Map(
      attendanceRows.map(row => [row.event_id, parseInt(row.presentCount, 10)])
    );

    const memberRows = groupIds.length
      ? await db('users_groups')
          .whereIn('group_id', groupIds)
          .select('group_id')
          .count('user_id as memberCount')
          .groupBy('group_id')
      : [];

    const memberMap = new Map(
      memberRows.map(row => [row.group_id, parseInt(row.memberCount, 10)])
    );

    events.forEach(event => {
      const bucket = findBucketForDate(buckets, event.date);
      if (!bucket) {
        return;
      }

      bucket.eventCount += 1;
      const groupSize = memberMap.get(event.group_id) || 0;
      bucket.totalPossible += groupSize;
      const present = attendanceMap.get(event.id) || 0;
      bucket.presentCount += present;
    });

    buckets.forEach(bucket => {
      bucket.attendanceRate = bucket.totalPossible > 0
        ? (bucket.presentCount / bucket.totalPossible) * 100
        : 0;
    });

    return formatAttendanceOverviewResponse(scope, scopeId, normalizedPeriod, buckets);
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