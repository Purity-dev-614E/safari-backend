const eventService = require('../services/eventService');
const userService = require('../services/userService'); // Assuming you have a userService to get user roles

module.exports = {
  async createEvent(req, res) {
    try {
      console.log('Creating event...');
      const { groupId } = req.params;
      const eventData = req.body;
      const userId = req.user.id; // Assuming req.user is set by the authenticate middleware

      console.log('Received event data:', eventData);
      console.log('User ID:', userId);
      console.log('Group ID:', groupId);

      // Ensure the date is correctly formatted
      if (eventData.date) {
        const date = new Date(eventData.date);
        if (isNaN(date.getTime())) {
          console.error('Invalid date format:', eventData.date);
          return res.status(400).json({ error: 'Invalid date format' });
        }
        eventData.date = date.toISOString().replace('T', ' ').replace('Z', '');
        console.log('Formatted date:', eventData.date);
      }

      eventData.group_id = groupId;
      console.log('Final event data to save:', eventData);

      const result = await eventService.createEvent(eventData);
      console.log('Event created successfully:', result[0]);
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  },

  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await eventService.getEventById(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  },

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const eventData = req.body;

      // Ensure the date is correctly formatted
      if (eventData.date) {
        const date = new Date(eventData.date);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ error: 'Invalid date format' });
        }
        eventData.date = date.toISOString().replace('T', ' ').replace('Z', '');
      }

      const result = await eventService.updateEvent(id, eventData);
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  },

  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const result = await eventService.deleteEvent(id);
      
      if (result === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  },

  async getAllEvents(req, res) {
    try {
      const events = await eventService.getAllEvents();
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },

  async getEventsByGroup(req, res) {
    try {
      const { groupId } = req.params;
      const events = await eventService.getEventsByGroup(groupId);
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching group events:', error);
      res.status(500).json({ error: 'Failed to fetch group events' });
    }
  }
};