const analyticsModel = require('../models/analyticsModel');
const regionAnalyticsModel = require('../models/regionAnalyticsModel');
const groupModel = require('../models/groupModel');

module.exports = {
  // Group Analytics
  async getGroupDemographics(groupId, userRegionId, bypassRegionCheck) {
    // If region check is bypassed (super admin), proceed normally
    if (bypassRegionCheck) {
      return analyticsModel.getGroupDemographics(groupId);
    }
    
    // Otherwise, check if the group belongs to the user's region
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view groups in your region.');
    }
    
    return analyticsModel.getGroupDemographics(groupId);
  },
  
  async getGroupAttendanceStats(groupId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getGroupAttendanceStats(groupId);
    }
    
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view groups in your region.');
    }
    
    return analyticsModel.getGroupAttendanceStats(groupId);
  },
  
  async getGroupGrowthAnalytics(groupId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getGroupGrowthAnalytics(groupId);
    }
    
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view groups in your region.');
    }
    
    return analyticsModel.getGroupGrowthAnalytics(groupId);
  },
  
  async compareGroups(groupIds, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.compareGroups(groupIds);
    }
    
    // Check if all groups belong to the user's region
    for (const groupId of groupIds) {
      const group = await groupModel.getGroupById(groupId);
      if (!group || group.region_id !== userRegionId) {
        throw new Error('Access denied. You can only compare groups in your region.');
      }
    }
    
    return analyticsModel.compareGroups(groupIds);
  },
  
  async getGroupEngagementMetrics(groupId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getGroupEngagementMetrics(groupId);
    }
    
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view groups in your region.');
    }
    
    return analyticsModel.getGroupEngagementMetrics(groupId);
  },
  
  async getGroupActivityTimeline(groupId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getGroupActivityTimeline(groupId);
    }
    
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view groups in your region.');
    }
    
    return analyticsModel.getGroupActivityTimeline(groupId);
  },
  
  // Attendance Analytics
  async getAttendanceByPeriod(period, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getAttendanceByPeriod(period);
    }
    
    // For region-specific users, get attendance only for their region
    return regionAnalyticsModel.getAttendanceByPeriodForRegion(period, userRegionId);
  },
  
  async getOverallAttendanceByPeriod(period, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getOverallAttendanceByPeriod(period);
    }
    
    // For region-specific users, get attendance only for their region
    return regionAnalyticsModel.getAttendanceByPeriodForRegion(period, userRegionId);
  },
  
  async getUserAttendanceTrends(userId, userRegionId, bypassRegionCheck) {
    // For user attendance, we need to check if the requested user is in the same region
    if (!bypassRegionCheck) {
      const user = await require('../models/userModel').getById(userId);
      if (!user || user.region_id !== userRegionId) {
        throw new Error('Access denied. You can only view users in your region.');
      }
    }
    
    return analyticsModel.getUserAttendanceTrends(userId);
  },
  
  async getGroupAttendanceTrends(groupId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getGroupAttendanceTrends(groupId);
    }
    
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view groups in your region.');
    }
    
    return analyticsModel.getGroupAttendanceTrends(groupId);
  },
  
  async getAttendanceByEventType(eventType, userRegionId, bypassRegionCheck) {
    // This would need to be implemented in regionAnalyticsModel
    if (bypassRegionCheck) {
      return analyticsModel.getAttendanceByEventType(eventType);
    }
    
    throw new Error('Region-specific event type analytics not implemented');
  },
  
  // Event Analytics
  async getEventParticipationStats(eventId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getEventParticipationStats(eventId);
    }
    
    // Check if the event belongs to a group in the user's region
    const event = await require('../models/eventModel').getById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    const group = await groupModel.getGroupById(event.group_id);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view events in your region.');
    }
    
    return analyticsModel.getEventParticipationStats(eventId);
  },
  
  async compareEventAttendance(eventIds, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.compareEventAttendance(eventIds);
    }
    
    // Check if all events belong to groups in the user's region
    const eventModel = require('../models/eventModel');
    for (const eventId of eventIds) {
      const event = await eventModel.getById(eventId);
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }
      
      const group = await groupModel.getGroupById(event.group_id);
      if (!group || group.region_id !== userRegionId) {
        throw new Error('Access denied. You can only compare events in your region.');
      }
    }
    
    return analyticsModel.compareEventAttendance(eventIds);
  },
  
  async getUpcomingEventsParticipationForecast(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getUpcomingEventsParticipationForecast();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific participation forecast not implemented');
  },
  
  async getPopularEvents(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getPopularEvents();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific popular events not implemented');
  },
  
  async getAttendanceByEventCategory(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getAttendanceByEventCategory();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific event category analytics not implemented');
  },
  
  // Member Analytics
  async getMemberParticipationStats(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getMemberParticipationStats();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific member participation stats not implemented');
  },
  
  async getMemberRetentionStats(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getMemberRetentionStats();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific member retention stats not implemented');
  },
  
  async getMemberEngagementScores(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getMemberEngagementScores();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific member engagement scores not implemented');
  },
  
  async getMemberActivityLevels(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getMemberActivityLevels();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific member activity levels not implemented');
  },
  
  async getAttendanceCorrelationFactors(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getAttendanceCorrelationFactors();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific attendance correlation factors not implemented');
  },
  
  // Dashboard Analytics
  async getDashboardSummary(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getDashboardSummary();
    }
    
    // For region-specific users, get dashboard summary only for their region
    return regionAnalyticsModel.getDashboardSummaryForRegion(userRegionId);
  },
  
  async getGroupDashboardData(groupId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getGroupDashboardData(groupId);
    }
    
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only view groups in your region.');
    }
    
    return analyticsModel.getGroupDashboardData(groupId);
  },
  
  async getDashboardTrends(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getDashboardTrends();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific dashboard trends not implemented');
  },
  
  async getPerformanceMetrics(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getPerformanceMetrics();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific performance metrics not implemented');
  },
  
  async getCustomDashboardData(timeframe, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.getCustomDashboardData(timeframe);
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific custom dashboard data not implemented');
  },
  
  // Export Analytics
  async exportAttendanceReport(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.exportAttendanceReport();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific attendance report export not implemented');
  },
  
  async exportMemberReport(userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.exportMemberReport();
    }
    
    // This would need to be implemented in regionAnalyticsModel
    throw new Error('Region-specific member report export not implemented');
  },
  
  async exportGroupReport(groupId, userRegionId, bypassRegionCheck) {
    if (bypassRegionCheck) {
      return analyticsModel.exportGroupReport(groupId);
    }
    
    const group = await groupModel.getGroupById(groupId);
    if (!group || group.region_id !== userRegionId) {
      throw new Error('Access denied. You can only export reports for groups in your region.');
    }
    
    return analyticsModel.exportGroupReport(groupId);
  }
}; 