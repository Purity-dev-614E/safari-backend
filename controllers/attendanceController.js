const attendanceService = require('../services/attendanceService');
const attendanceModel = require ('../models/attendanceModel')

const { normalizeAttendancePayload, validateAttendancePayload } = require('../utils/attendancePayloadUtils');

module.exports = {
  async createAttendance(req, res) {
    try {
      const attendanceData = normalizeAttendancePayload(req.body);
      validateAttendancePayload(attendanceData);
      
      const result = await attendanceService.createAttendance(attendanceData);
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating attendance:', error);
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to create attendance' });
    }
  },

  async getAttendanceById(req, res) {
    try {
      const { id } = req.params;
      const attendance = await attendanceService.getAttendanceById(id);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attendance by ID:', error);
      res.status(500).json({ error: 'Failed to fetch attendance by ID' });
    }
  },

  async updateAttendance(req, res) {
    try {
      const { id } = req.params;
      const attendanceData = normalizeAttendancePayload(req.body);
      validateAttendancePayload(attendanceData, { partial: true });
      
      const result = await attendanceService.updateAttendance(id, attendanceData);
      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating attendance:', error);
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || 'Failed to update attendance' });
    }
  },

  async deleteAttendance(req, res) {
    try {
      const { id } = req.params;
      await attendanceService.deleteAttendance(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      res.status(500).json({ error: 'Failed to delete attendance' });
    }
  },

  async getAttendanceByEvent(req, res) {
    try {
      const { eventId } = req.params;
      const attendance = await attendanceService.getAttendanceByEvent(eventId);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attendance by event:', error);
      res.status(500).json({ error: 'Failed to fetch attendance by event' });
    }
  },

  async getAttendanceByUser(req, res) {
    try {
      const { userId } = req.params;
      const attendance = await attendanceService.getAttendanceByUser(userId);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attendance by user:', error);
      res.status(500).json({ error: 'Failed to fetch attendance by user' });
    }
  },

  async getAttendanceByTimePeriod(req, res) {
    try {
      const { period } = req.query;
      const attendance = await attendanceService.getAttendanceByTimePeriod(period);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attendance by time period:', error);
      res.status(500).json({ error: 'Failed to fetch attendance by time period' });
    }
  },

  async getByAttendedUsers(req, res) {
    try {
      const { eventId } = req.params;
      const attendance = await attendanceService.getByAttendedUsers(eventId);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attended users:', error);
      res.status(500).json({ error: 'Failed to fetch attended users' });
    }
  },

  async getAttendanceStatus(req, res) {
    try {
      const { eventId, userId } = req.params;
      const status = await attendanceService.getAttendanceStatus(eventId, userId);
      res.status(200).json(status);
    } catch (error) {
      console.error('Error fetching attendance status:', error);
      res.status(500).json({ error: 'Failed to fetch attendance status' });
    }
  },

  async getGroupAttendance(req, res) {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const stats = await attendanceModel.getAttendancePercentage(groupId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},

async createLeadershipAttendance(req, res) {
  try {
    const { eventId } = req.params;
    const attendanceData = normalizeAttendancePayload(req.body);
    validateAttendancePayload(attendanceData);
    
    // Verify this is a leadership event
    const eventModel = require('../models/eventModel');
    const event = await eventModel.getById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    if (event.tag !== 'leadership') {
      return res.status(400).json({ error: 'This endpoint is only for leadership events' });
    }
    
    // Verify user is RC or admin (eligible for leadership events)
    const userModel = require('../models/userModel');
    const user = await userModel.getById(attendanceData.user_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!['rc', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Only RCs and admins can attend leadership events' });
    }
    
    // Check target audience restrictions
    if (event.target_audience === 'rc_only' && user.role !== 'rc') {
      return res.status(403).json({ error: 'This event is only for RCs' });
    }
    
    if (event.target_audience === 'regional' && user.region_id !== event.region_id) {
      return res.status(403).json({ error: 'User is not in the event\'s region' });
    }
    
    // Create attendance record
    const result = await attendanceService.createLeadershipAttendance(attendanceData);
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating leadership attendance:', error);
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || 'Failed to create leadership attendance' });
  }
},

async getLeadershipAttendees(req, res) {
  try {
    const requesterRole = req.fullUser?.role;
    const requesterRegionId = req.fullUser?.region_id;
    const { user_tle } = req.query; // Get user_tle from query params

    // Validate that the user has leadership role
    if (!['regional manager', 'admin', 'super admin', 'root'].includes(requesterRole)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }

    // Validate user_tle parameter
    if (!user_tle) {
      return res.status(400).json({ error: 'user_tle parameter is required' });
    }

    // Convert user_tle to array if it's a string
    const userTleArray = Array.isArray(user_tle) ? user_tle : [user_tle];

    const attendees = await attendanceService.getLeadershipAttendees(
      requesterRole,
      requesterRegionId,
      userTleArray
    );

    res.status(200).json(attendees);
  } catch (error) {
    console.error('Error fetching leadership attendees:', error);
    res.status(500).json({ error: 'Failed to fetch leadership attendees' });
  }
}
};