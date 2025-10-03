const attendanceService = require('../services/attendanceService');
const attendanceModel = require ('../models/attendanceModel')

module.exports = {
  async createAttendance(req, res) {
    try {
      const attendanceData = req.body;
      const result = await attendanceService.createAttendance(attendanceData);
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating attendance:', error);
      res.status(500).json({ error: 'Failed to create attendance' });
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
      const attendanceData = req.body;
      const result = await attendanceService.updateAttendance(id, attendanceData);
      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: 'Failed to update attendance' });
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
  }
};