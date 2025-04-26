const analyticsModel = require('../models/analyticsModel');

module.exports = {
  // Group Analytics
  async getGroupDemographics(req, res) {
    try {
      const { groupId } = req.params;
      const demographics = await analyticsModel.getGroupDemographics(groupId);
      res.status(200).json(demographics);
    } catch (error) {
      console.error('Error in getGroupDemographics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group demographics' });
    }
  },
  
  async getGroupAttendanceStats(req, res) {
    try {
      const { groupId } = req.params;
      const stats = await analyticsModel.getGroupAttendanceStats(groupId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getGroupAttendanceStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group attendance stats' });
    }
  },
  
  async getGroupGrowthAnalytics(req, res) {
    try {
      const { groupId } = req.params;
      const analytics = await analyticsModel.getGroupGrowthAnalytics(groupId);
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
      const comparison = await analyticsModel.compareGroups(groupIds);
      res.status(200).json(comparison);
    } catch (error) {
      console.error('Error in compareGroups controller:', error);
      res.status(500).json({ error: error.message || 'Failed to compare groups' });
    }
  },
  
  // Attendance Analytics
  async getAttendanceByPeriod(req, res) {
    try {
      const { period } = req.params;
      if (!period || !['week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Valid period (week, month, year) is required' });
      }
      const stats = await analyticsModel.getAttendanceByPeriod(period);
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
      const stats = await analyticsModel.getOverallAttendanceByPeriod(period);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getOverallAttendanceByPeriod controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch overall attendance by period' });
    }
  },
  
  async getUserAttendanceTrends(req, res) {
    try {
      const { userId } = req.params;
      const trends = await analyticsModel.getUserAttendanceTrends(userId);
      res.status(200).json(trends);
    } catch (error) {
      console.error('Error in getUserAttendanceTrends controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch user attendance trends' });
    }
  },
  
  // Event Analytics
  async getEventParticipationStats(req, res) {
    try {
      const { eventId } = req.params;
      const stats = await analyticsModel.getEventParticipationStats(eventId);
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
      const comparison = await analyticsModel.compareEventAttendance(eventIds);
      res.status(200).json(comparison);
    } catch (error) {
      console.error('Error in compareEventAttendance controller:', error);
      res.status(500).json({ error: error.message || 'Failed to compare event attendance' });
    }
  },
  
  // Member Analytics
  async getMemberParticipationStats(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const stats = await analyticsModel.getMemberParticipationStats(start_date, end_date);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getMemberParticipationStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member participation stats' });
    }
  },
  
  async getMemberActivityStatus(req, res) {
    try {
      const stats = await analyticsModel.getMemberActivityStatus();
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getMemberActivityStatus controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member activity status' });
    }
  },
  
  // Dashboard Analytics
  async getDashboardSummary(req, res) {
    try {
      const summary = await analyticsModel.getDashboardSummary();
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error in getDashboardSummary controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard summary' });
    }
  },
  
  async getGroupDashboardData(req, res) {
    try {
      const { groupId } = req.params;
      const data = await analyticsModel.getGroupDashboardData(groupId);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getGroupDashboardData controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group dashboard data' });
    }
  }
};