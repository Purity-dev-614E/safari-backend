const analyticsService = require('../services/analyticsService');

module.exports = {
  // Group Analytics
  async getGroupDemographics(req, res) {
    try {
      const { groupId } = req.params;
      const demographics = await analyticsService.getGroupDemographics(
        groupId, 
        req.userRegionId, 
        req.bypassRegionCheck
      );
      res.status(200).json(demographics);
    } catch (error) {
      console.error('Error in getGroupDemographics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group demographics' });
    }
  },
  
  async getGroupAttendanceStats(req, res) {
    try {
      const { groupId } = req.params;
      const stats = await analyticsService.getGroupAttendanceStats(
        groupId,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getGroupAttendanceStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group attendance stats' });
    }
  },
  
  async getGroupGrowthAnalytics(req, res) {
    try {
      const { groupId } = req.params;
      const analytics = await analyticsService.getGroupGrowthAnalytics(
        groupId,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(analytics);
    } catch (error) {
      console.error('Error in getGroupGrowthAnalytics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group growth analytics' });
    }
  },
  
  async compareGroups(req, res) {
    try {
      const { groupIds } = req.body;
      if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
        return res.status(400).json({ error: 'Group IDs array is required' });
      }
      const comparison = await analyticsService.compareGroups(
        groupIds,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(comparison);
    } catch (error) {
      console.error('Error in compareGroups controller:', error);
      res.status(500).json({ error: error.message || 'Failed to compare groups' });
    }
  },
  
  async getGroupEngagementMetrics(req, res) {
    try {
      const { groupId } = req.params;
      const metrics = await analyticsService.getGroupEngagementMetrics(groupId);
      res.status(200).json(metrics);
    } catch (error) {
      console.error('Error in getGroupEngagementMetrics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group engagement metrics' });
    }
  },
  
  async getGroupActivityTimeline(req, res) {
    try {
      const { groupId } = req.params;
      const timeline = await analyticsService.getGroupActivityTimeline(groupId);
      res.status(200).json(timeline);
    } catch (error) {
      console.error('Error in getGroupActivityTimeline controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group activity timeline' });
    }
  },
  
  // Attendance Analytics
  async getAttendanceByWeek(req, res) {
    try {
      const stats = await analyticsService.getAttendanceByPeriod(
        'week',
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getAttendanceByWeek controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch weekly attendance' });
    }
  },
  
  async getAttendanceByMonth(req, res) {
    try {
      const stats = await analyticsService.getAttendanceByPeriod(
        'month',
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getAttendanceByMonth controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch monthly attendance' });
    }
  },
  
  async getAttendanceByYear(req, res) {
    try {
      const stats = await analyticsService.getAttendanceByPeriod(
        'year',
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getAttendanceByYear controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch yearly attendance' });
    }
  },
  
  async getAttendanceByPeriod(req, res) {
    try {
      const { period } = req.params;
      if (!period || !['week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Valid period (week, month, year) is required' });
      }
      const stats = await analyticsService.getAttendanceByPeriod(
        period,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getAttendanceByPeriod controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attendance by period' });
    }
  },
  
  async getOverallAttendanceByPeriod(req, res) {
    try {
      const { period } = req.params;
      if (!period || !['week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Valid period (week, month, year) is required' });
      }
      const stats = await analyticsService.getOverallAttendanceByPeriod(
        period,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getOverallAttendanceByPeriod controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch overall attendance by period' });
    }
  },
  
  async getUserAttendanceTrends(req, res) {
    try {
      const { userId } = req.params;
      const trends = await analyticsService.getUserAttendanceTrends(
        userId,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(trends);
    } catch (error) {
      console.error('Error in getUserAttendanceTrends controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch user attendance trends' });
    }
  },
  
  async getGroupAttendanceTrends(req, res) {
    try {
      const { groupId } = req.params;
      const trends = await analyticsService.getGroupAttendanceTrends(groupId);
      res.status(200).json(trends);
    } catch (error) {
      console.error('Error in getGroupAttendanceTrends controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group attendance trends' });
    }
  },
  
  async getAttendanceByEventType(req, res) {
    try {
      const { eventType } = req.params;
      const stats = await analyticsService.getAttendanceByEventType(eventType);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getAttendanceByEventType controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attendance by event type' });
    }
  },

  async getAttendanceOverview(req, res) {
    try {
      const { period, scope = 'overall', regionId, groupId } = req.query;

      if (!period) {
        return res.status(400).json({ error: 'period query parameter is required' });
      }

      if (scope === 'group' && !groupId) {
        return res.status(400).json({ error: 'groupId is required when scope is group' });
      }

      const scopeId = scope === 'group' ? groupId : scope === 'region' ? regionId : undefined;

      const overview = await analyticsService.getAttendanceOverview(
        period,
        scope,
        scopeId,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(overview);
    } catch (error) {
      console.error('Error in getAttendanceOverview controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attendance overview' });
    }
  },
  
  // Event Analytics
  async getEventParticipationStats(req, res) {
    try {
      const { eventId } = req.params;
      const stats = await analyticsService.getEventParticipationStats(
        eventId,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getEventParticipationStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch event participation stats' });
    }
  },
  
  async compareEventAttendance(req, res) {
    try {
      const { eventIds } = req.body;
      if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
        return res.status(400).json({ error: 'Event IDs array is required' });
      }
      const comparison = await analyticsService.compareEventAttendance(
        eventIds,
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(comparison);
    } catch (error) {
      console.error('Error in compareEventAttendance controller:', error);
      res.status(500).json({ error: error.message || 'Failed to compare event attendance' });
    }
  },
  
  async getUpcomingEventsParticipationForecast(req, res) {
    try {
      const forecast = await analyticsService.getUpcomingEventsParticipationForecast();
      res.status(200).json(forecast);
    } catch (error) {
      console.error('Error in getUpcomingEventsParticipationForecast controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch upcoming events participation forecast' });
    }
  },
  
  async getPopularEvents(req, res) {
    try {
      const events = await analyticsService.getPopularEvents();
      res.status(200).json(events);
    } catch (error) {
      console.error('Error in getPopularEvents controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch popular events' });
    }
  },
  
  async getAttendanceByEventCategory(req, res) {
    try {
      const stats = await analyticsService.getAttendanceByEventCategory();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getAttendanceByEventCategory controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attendance by event category' });
    }
  },
  
  // Member Analytics
  async getMemberParticipationStats(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const stats = await analyticsService.getMemberParticipationStats(
        req.userRegionId,
        req.bypassRegionCheck,
        start_date,
        end_date
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getMemberParticipationStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member participation stats' });
    }
  },
  
  async getMemberRetentionStats(req, res) {
    try {
      const stats = await analyticsService.getMemberRetentionStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getMemberRetentionStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member retention stats' });
    }
  },
  
  async getMemberActivityStatus(req, res) {
    try {
      const stats = await analyticsService.getMemberActivityStatus(
        req.userRegionId,
        req.bypassRegionCheck
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getMemberActivityStatus controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member activity status' });
    }
  },
  
  async getMemberEngagementScores(req, res) {
    try {
      const scores = await analyticsService.getMemberEngagementScores();
      res.status(200).json(scores);
    } catch (error) {
      console.error('Error in getMemberEngagementScores controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member engagement scores' });
    }
  },
  
  async getMemberActivityLevels(req, res) {
    try {
      const levels = await analyticsService.getMemberActivityLevels();
      res.status(200).json(levels);
    } catch (error) {
      console.error('Error in getMemberActivityLevels controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member activity levels' });
    }
  },
  
  async getAttendanceCorrelationFactors(req, res) {
    try {
      const factors = await analyticsService.getAttendanceCorrelationFactors();
      res.status(200).json(factors);
    } catch (error) {
      console.error('Error in getAttendanceCorrelationFactors controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attendance correlation factors' });
    }
  },
  
  // Dashboard Analytics
  async getDashboardSummary(req, res) {
    try {
      const summary = await analyticsService.getDashboardSummary();
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error in getDashboardSummary controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard summary' });
    }
  },
  
  async getGroupDashboardData(req, res) {
    try {
      const { groupId } = req.params;
      const data = await analyticsService.getGroupDashboardData(groupId);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getGroupDashboardData controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group dashboard data' });
    }
  },
  
  async getDashboardTrends(req, res) {
    try {
      const trends = await analyticsService.getDashboardTrends();
      res.status(200).json(trends);
    } catch (error) {
      console.error('Error in getDashboardTrends controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard trends' });
    }
  },
  
  async getPerformanceMetrics(req, res) {
    try {
      const metrics = await analyticsService.getPerformanceMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      console.error('Error in getPerformanceMetrics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch performance metrics' });
    }
  },
  
  async getCustomDashboardData(req, res) {
    try {
      const { timeframe } = req.params;
      const data = await analyticsService.getCustomDashboardData(timeframe);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getCustomDashboardData controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch custom dashboard data' });
    }
  },
  
  // Export Analytics
  async exportAttendanceReport(req, res) {
    try {
      const report = await analyticsService.exportAttendanceReport();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.json');
      res.status(200).json(report);
    } catch (error) {
      console.error('Error in exportAttendanceReport controller:', error);
      res.status(500).json({ error: error.message || 'Failed to export attendance report' });
    }
  },
  
  async exportMemberReport(req, res) {
    try {
      const report = await analyticsService.exportMemberReport();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=member-report.json');
      res.status(200).json(report);
    } catch (error) {
      console.error('Error in exportMemberReport controller:', error);
      res.status(500).json({ error: error.message || 'Failed to export member report' });
    }
  },
  
  async exportGroupReport(req, res) {
    try {
      const { groupId } = req.params;
      const report = await analyticsService.exportGroupReport(groupId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=group-report.json');
      res.status(200).json(report);
    } catch (error) {
      console.error('Error in exportGroupReport controller:', error);
      res.status(500).json({ error: error.message || 'Failed to export group report' });
    }
  }
}; 