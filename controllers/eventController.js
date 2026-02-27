const eventService = require('../services/eventService');
const userService = require('../services/userService');
const groupService = require('../services/groupService');

module.exports = {
  async createEvent(req, res) {
    try {
      console.log('Creating event...');
      const { groupId } = req.params;
      const eventData = req.body;
      const requesterRole = req.fullUser?.role;
      const requesterId = req.fullUser?.id;
      const requesterRegionId = req.fullUser?.region_id;

      console.log('Received event data:', eventData);
      console.log('User ID:', requesterId);
      console.log('Group ID:', groupId);

      // Check if group exists and get group data
      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }

      if (requesterRole === 'admin' && group.group_admin_id !== requesterId) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }

      // Ensure date is correctly formatted
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

      // Get group data to check permissions
      const group = await groupService.getGroupById(event.group_id);
      if (!group) {
        return res.status(404).json({ error: 'Associated group not found' });
      }

      // Check access permissions
      const requesterRole = req.fullUser?.role;
      const requesterId = req.fullUser?.id;
      const requesterRegionId = req.fullUser?.region_id;

      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Event not in your region' });
      }

      if (requesterRole === 'admin' && group.group_admin_id !== requesterId) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
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
      const requesterRole = req.fullUser?.role;
      const requesterId = req.fullUser?.id;
      const requesterRegionId = req.fullUser?.region_id;

      // Check if event exists and get event data
      const existingEvent = await eventService.getEventById(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get group data to check permissions
      const group = await groupService.getGroupById(existingEvent.group_id);
      if (!group) {
        return res.status(404).json({ error: 'Associated group not found' });
      }

      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Event not in your region' });
      }

      if (requesterRole === 'admin' && group.group_admin_id !== requesterId) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }

      // Ensure date is correctly formatted
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
      const requesterRole = req.fullUser?.role;
      const requesterId = req.fullUser?.id;
      const requesterRegionId = req.fullUser?.region_id;

      // Check if event exists and get event data
      const existingEvent = await eventService.getEventById(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get group data to check permissions
      const group = await groupService.getGroupById(existingEvent.group_id);
      if (!group) {
        return res.status(404).json({ error: 'Associated group not found' });
      }

      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Event not in your region' });
      }

      if (requesterRole === 'admin' && group.group_admin_id !== requesterId) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }

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
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      const regionId = req.query.region_id;
      
      let events;
      
      // Root and super admin can see all events
      if (['root', 'super admin'].includes(requesterRole)) {
        events = await eventService.getAllEvents(regionId);
      }
      // Regional managers can only see events in their region
      else if (requesterRole === 'regional manager') {
        events = await eventService.getAllEvents(requesterRegionId);
      }
      // Admins can only see events in their groups
      else if (requesterRole === 'admin') {
        events = await eventService.getEventsByAdminGroups(requesterId);
      }
      // Users can only see events in their groups
      else {
        events = await eventService.getEventsByUserGroups(requesterId);
      }
      
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },

  async getEventsByGroup(req, res) {
    try {
      const { groupId } = req.params;
      const requesterRole = req.fullUser?.role;
      const requesterId = req.fullUser?.id;
      const requesterRegionId = req.fullUser?.region_id;

      // Check if group exists and get group data
      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }

      if (requesterRole === 'admin' && group.group_admin_id !== requesterId) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }

      const events = await eventService.getEventsByGroup(groupId);
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching group events:', error);
      res.status(500).json({ error: 'Failed to fetch group events' });
    }
  }
};
