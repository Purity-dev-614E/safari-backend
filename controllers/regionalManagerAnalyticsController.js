const regionAnalyticsModel = require('../models/regionAnalyticsModel');
const groupModel = require('../models/groupModel');
const eventModel = require('../models/eventModel');

module.exports = {
  // Group Analytics
  async getGroupDemographics(req, res) {
    try {
      const { groupId } = req.params;
      const regionId = req.fullUser.region_id;
      
      // Check if the group belongs to the user's region
      const group = await groupModel.getGroupById(groupId);
      if (!group || group.region_id !== regionId) {
        return res.status(403).json({ error: 'Access denied. You can only view groups in your region.' });
      }
      
      const demographics = await regionAnalyticsModel.getGroupDemographicsForRegion(groupId);
      res.status(200).json(demographics);
    } catch (error) {
      console.error('Error in getGroupDemographics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group demographics' });
    }
  },
  
  async getGroupAttendanceStats(req, res) {
    try {
      const { groupId } = req.params;
      const regionId = req.fullUser.region_id;
      
      // Check if the group belongs to the user's region
      const group = await groupModel.getGroupById(groupId);
      if (!group || group.region_id !== regionId) {
        return res.status(403).json({ error: 'Access denied. You can only view groups in your region.' });
      }
      
      const stats = await regionAnalyticsModel.getGroupAttendanceStatsForRegion(groupId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getGroupAttendanceStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group attendance stats' });
    }
  },
  
  async getGroupGrowthAnalytics(req, res) {
    try {
      const { groupId } = req.params;
      const regionId = req.fullUser.region_id;
      
      // Check if the group belongs to the user's region
      const group = await groupModel.getGroupById(groupId);
      if (!group || group.region_id !== regionId) {
        return res.status(403).json({ error: 'Access denied. You can only view groups in your region.' });
      }
      
      const analytics = await regionAnalyticsModel.getGroupGrowthAnalyticsForRegion(groupId);
      res.status(200).json(analytics);
    } catch (error) {
      console.error('Error in getGroupGrowthAnalytics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group growth analytics' });
    }
  },
  
  async compareGroups(req, res) {
    try {
      const { groupIds } = req.body;
      const regionId = req.fullUser.region_id;
      
      if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
        return res.status(400).json({ error: 'Group IDs array is required' });
      }
      
      // Check if all groups belong to the user's region
      for (const groupId of groupIds) {
        const group = await groupModel.getGroupById(groupId);
        if (!group || group.region_id !== regionId) {
          return res.status(403).json({ error: 'Access denied. You can only compare groups in your region.' });
        }
      }
      
      const comparison = await regionAnalyticsModel.compareGroupsInRegion(groupIds, regionId);
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
      const regionId = req.fullUser.region_id;
      
      if (!period || !['week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Valid period (week, month, year) is required' });
      }
      
      const stats = await regionAnalyticsModel.getAttendanceByPeriodForRegion(period, regionId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getAttendanceByPeriod controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch attendance by period' });
    }
  },
  
  async getOverallAttendanceByPeriod(req, res) {
    try {
      const { period } = req.params;
      const regionId = req.fullUser.region_id;
      
      if (!period || !['week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Valid period (week, month, year) is required' });
      }
      
      const stats = await regionAnalyticsModel.getOverallAttendanceByPeriodForRegion(period, regionId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getOverallAttendanceByPeriod controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch overall attendance by period' });
    }
  },
  
  async getUserAttendanceTrends(req, res) {
    try {
      const { userId } = req.params;
      const regionId = req.fullUser.region_id;
      
      // Check if the user belongs to the manager's region
      const user = await require('../models/userModel').getById(userId);
      if (!user || user.region_id !== regionId) {
        return res.status(403).json({ error: 'Access denied. You can only view users in your region.' });
      }
      
      const trends = await regionAnalyticsModel.getUserAttendanceTrendsForRegion(userId, regionId);
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
      const regionId = req.fullUser.region_id;
      
      // Check if the event belongs to a group in the user's region
      const event = await eventModel.getById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      const group = await groupModel.getGroupById(event.group_id);
      if (!group || group.region_id !== regionId) {
        return res.status(403).json({ error: 'Access denied. You can only view events in your region.' });
      }
      
      const stats = await regionAnalyticsModel.getEventParticipationStatsForRegion(eventId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getEventParticipationStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch event participation stats' });
    }
  },
  
  async compareEventAttendance(req, res) {
    try {
      const { eventIds } = req.body;
      const regionId = req.fullUser.region_id;
      
      if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
        return res.status(400).json({ error: 'Event IDs array is required' });
      }
      
      // Check if all events belong to groups in the user's region
      for (const eventId of eventIds) {
        const event = await eventModel.getById(eventId);
        if (!event) {
          return res.status(404).json({ error: `Event ${eventId} not found` });
        }
        
        const group = await groupModel.getGroupById(event.group_id);
        if (!group || group.region_id !== regionId) {
          return res.status(403).json({ error: 'Access denied. You can only compare events in your region.' });
        }
      }
      
      const comparison = await regionAnalyticsModel.compareEventAttendanceInRegion(eventIds, regionId);
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
      const regionId = req.fullUser.region_id;
      
      const stats = await regionAnalyticsModel.getMemberParticipationStatsForRegion(regionId, start_date, end_date);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getMemberParticipationStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member participation stats' });
    }
  },
  
  async getMemberActivityStatus(req, res) {
    try {
      const regionId = req.fullUser.region_id;
      const stats = await regionAnalyticsModel.getMemberActivityStatusForRegion(regionId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getMemberActivityStatus controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch member activity status' });
    }
  },
  
  // Dashboard Analytics
  async getDashboardSummary(req, res) {
    try {
      const regionId = req.fullUser.region_id;
      const summary = await regionAnalyticsModel.getDashboardSummaryForRegion(regionId);
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error in getDashboardSummary controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard summary' });
    }
  },
  
  async getGroupDashboardData(req, res) {
    try {
      const { groupId } = req.params;
      const regionId = req.fullUser.region_id;
      
      // Check if the group belongs to the user's region
      const group = await groupModel.getGroupById(groupId);
      if (!group || group.region_id !== regionId) {
        return res.status(403).json({ error: 'Access denied. You can only view groups in your region.' });
      }
      
      const data = await regionAnalyticsModel.getGroupDashboardDataForRegion(groupId);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getGroupDashboardData controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group dashboard data' });
    }
  }
};