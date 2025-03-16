const attendanceService = require('../services/attendanceService');
const eventService = require('../services/eventService');

module.exports = {
  async createAttendance(req, res) {
    try {
      const { eventId } = req.params;
      const attendanceData = req.body;

      // Ensure the event exists and is associated with a group
      const event = await eventService.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      attendanceData.event_id = eventId;
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

      if (!attendance) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }

      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  },

  async updateAttendance(req, res) {
    try {
      const { id } = req.params;
      const attendanceData = req.body;
      const result = await attendanceService.updateAttendance(id, attendanceData);

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }

      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: 'Failed to update attendance' });
    }
  },

  async deleteAttendance(req, res) {
    try {
      const { id } = req.params;
      const result = await attendanceService.deleteAttendance(id);

      if (result === 0) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }

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
      console.error('Error fetching event attendance:', error);
      res.status(500).json({ error: 'Failed to fetch event attendance' });
    }
  },

  async getAttendanceByUser(req, res) {
    try {
      const { userId } = req.params;
      const attendance = await attendanceService.getAttendanceByUser(userId);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching user attendance:', error);
      res.status(500).json({ error: 'Failed to fetch user attendance' });
    }
  },

  async getAttendanceByTimePeriod(req, res) {
    try {
      const { start, end } = req.query;
      const attendance = await attendanceService.getAttendanceByTimePeriod(start, end);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching attendance by time period:', error);
      res.status(500).json({ error: 'Failed to fetch attendance by time period' });
    }
  }
};