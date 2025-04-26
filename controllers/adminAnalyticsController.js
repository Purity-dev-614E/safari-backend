const analyticsModel = require('../models/analyticsModel');
const adminAnalyticsModel = require('../models/adminAnalyticsModel');
const groupModel = require('../models/groupModel');
const userModel = require('../models/userModel');

module.exports = {
  // Group Analytics - Admin can only access their own group
  async getGroupDemographics(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.fullUser.id;
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, groupId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view groups you administer.' });
      }
      
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
      const userId = req.fullUser.id;
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, groupId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view groups you administer.' });
      }
      
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
      const userId = req.fullUser.id;
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, groupId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view groups you administer.' });
      }
      
      const analytics = await analyticsModel.getGroupGrowthAnalytics(groupId);
      res.status(200).json(analytics);
    } catch (error) {
      console.error('Error in getGroupGrowthAnalytics controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group growth analytics' });
    }
  },
  
  // Attendance Analytics - Admin can only access their own group's attendance
  async getGroupAttendanceByPeriod(req, res) {
    try {
      const { groupId, period } = req.params;
      const userId = req.fullUser.id;
      
      if (!period || !['week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Valid period (week, month, year) is required' });
      }
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, groupId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view groups you administer.' });
      }
      
      const stats = await adminAnalyticsModel.getGroupAttendanceByPeriod(groupId, period);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getGroupAttendanceByPeriod controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group attendance by period' });
    }
  },
  
  // Event Analytics - Admin can only access their own group's events
  async getEventParticipationStats(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.fullUser.id;
      
      // Get the event
      const event = await require('../models/eventModel').getById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, event.group_id);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view events for groups you administer.' });
      }
      
      const stats = await analyticsModel.getEventParticipationStats(eventId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getEventParticipationStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch event participation stats' });
    }
  },
  
  // Member Analytics - Admin can only access members of their own group
  async getGroupMemberParticipationStats(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.fullUser.id;
      const { start_date, end_date } = req.query;
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, groupId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view groups you administer.' });
      }
      
      const stats = await adminAnalyticsModel.getGroupMemberParticipationStats(groupId, start_date, end_date);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getGroupMemberParticipationStats controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group member participation stats' });
    }
  },
  
  async getGroupMemberActivityStatus(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.fullUser.id;
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, groupId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view groups you administer.' });
      }
      
      const stats = await adminAnalyticsModel.getGroupMemberActivityStatus(groupId);
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error in getGroupMemberActivityStatus controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group member activity status' });
    }
  },
  
  // Dashboard Analytics - Admin can only access their own group's dashboard
  async getGroupDashboardData(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.fullUser.id;
      
      // Check if the admin is part of this group
      const isAdmin = await isGroupAdmin(userId, groupId);
      if (!isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only view groups you administer.' });
      }
      
      const data = await analyticsModel.getGroupDashboardData(groupId);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getGroupDashboardData controller:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch group dashboard data' });
    }
  }
};

// Helper function to check if a user is an admin of a group
async function isGroupAdmin(userId, groupId) {
  try {
    const userGroupModel = require('../models/userGroupModel');
    return await userGroupModel.isGroupAdmin(userId, groupId);
  } catch (error) {
    console.error('Error checking if user is group admin:', error);
    return false;
  }
}