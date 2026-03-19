const eventModel = require("../models/eventModel");
const userCountService = require("./userCountService");

module.exports = {
  async createEvent(eventData) {
    // Set default tag to 'org' if not provided
    if (!eventData.tag) {
      eventData.tag = 'org';
    }
    
    // Validate tag value
    if (!['org', 'leadership'].includes(eventData.tag)) {
      throw new Error("Invalid tag value. Must be 'org' or 'leadership'");
    }

    // For leadership events, validate regional_id is provided
    if (eventData.tag === 'leadership') {
      if (!eventData.regional_id) {
        throw new Error("regional_id is required for leadership events");
      }
      
      // Set default target_audience for leadership events
      if (!eventData.target_audience) {
        eventData.target_audience = 'all';
      }
    }

    // Validate target_audience for leadership events
    if (eventData.tag === 'leadership' && eventData.target_audience) {
      if (!['all', 'rc_only', 'regional'].includes(eventData.target_audience)) {
        throw new Error("Invalid target_audience value. Must be 'all', 'rc_only', or 'regional'");
      }
    }

    if (eventData.date) {
      const date = new Date(eventData.date);
      if (isNaN(date.getTime())) throw new Error("Invalid date format");

      // Store as UTC ISO8601 string
      eventData.date = date.toISOString(); // KEEP 'Z'
    }
    return eventModel.create(eventData);
  },

  async getEventById(id) {
    return eventModel.getById(id);
  },

  async updateEvent(id, eventData) {
    // Ensure the date is correctly formatted
    if (eventData.date) {
      const date = new Date(eventData.date);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      eventData.date = date.toISOString(); // KEEP 'Z'
    }
    return eventModel.update(id, eventData);
  },

  async deleteEvent(id) {
    return eventModel.delete(id);
  },

  async getAllEvents(regionId = null) {
    // This would need to be implemented based on your event model
    // For now, return all events (this should be restricted in production)
    return eventModel.getAll();
  },

  async getEventsByAdminGroups(adminId) {
    // Get groups where user is admin
    const groupModel = require('../models/groupModel');
    const adminGroups = await groupModel.getAdminGroups(adminId);
    
    if (adminGroups.length === 0) {
      return []; // Admin is not admin of any groups
    }
    
    // Get events for all admin's groups
    const groupIds = adminGroups.map(group => group.id);
    const events = await eventModel.getAll()
      .select('*')
      .whereIn('group_id', groupIds);
    
    return events;
  },

  async getEventsByUserGroups(userId) {
    // Get user's groups first
    const groupModel = require('../models/groupModel');
    const userGroups = await groupModel.getGroupsByUserId(userId);
    
    if (userGroups.length === 0) {
      return []; // User is not in any groups
    }
    
    // Get events for all user's groups
    const groupIds = userGroups.map(group => group.id);
    const events = await eventModel.getAll()
      .select('*')
      .whereIn('group_id', groupIds)
      .where('tag', 'org'); // Only org events for regular users
    
    return events;
  },

  async getEventsByGroup(groupId) {
    return eventModel.getByGroup(groupId);
  },

  async getEventsByGroupAndTag(groupId, tag) {
    return eventModel.getByGroupAndTag(groupId, tag);
  },

  async getEventsByRegionAndTag(regionId, tag) {
    return eventModel.getByRegionAndTag(regionId, tag);
  },

  async getEventsByTag(tag) {
    return eventModel.getByTag(tag);
  },

  async getLeadershipEvents(regionId = null) {
    // Get only leadership events, optionally filtered by region
    if (regionId) {
      return eventModel.getLeadershipEventsByRegion(regionId);
    }
    return eventModel.getByTag('leadership');
  },

  async getLeadershipEventsWithParticipants(regionId = null) {
    // Get leadership events with their participant counts
    const events = regionId 
      ? await eventModel.getLeadershipEventsByRegion(regionId)
      : await eventModel.getByTag('leadership');
    
    // For each event, get participant count based on target audience
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        let participantCount = 0;
        
        switch (event.target_audience) {
          case 'all':
            // Count all RCs and admins
            participantCount = await userCountService.countUsersByRole(['rc', 'admin']);
            break;
          case 'rc_only':
            // Count only RCs
            participantCount = await userCountService.countUsersByRole(['rc']);
            break;
          case 'regional':
            // Count RCs and admins in specific region
            if (event.regional_id) {
              participantCount = await userCountService.countUsersByRoleAndRegion(['rc', 'admin'], event.regional_id);
            }
            break;
        }
        
        return {
          ...event,
          participant_count: participantCount,
          invited_count: participantCount // For frontend compatibility
        };
      })
    );
    
    return eventsWithCounts;
  }
};
