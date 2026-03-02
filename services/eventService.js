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

    // Set default target_audience for leadership events
    if (eventData.tag === 'leadership' && !eventData.target_audience) {
      eventData.target_audience = 'all';
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
    // This would need to be implemented based on your group structure
    // For now, return all events (this should be restricted in production)
    return eventModel.getAll();
  },

  async getEventsByUserGroups(userId) {
    // This would need to be implemented based on your group structure
    // For now, return all events (this should be restricted in production)
    return eventModel.getAll();
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
    return eventModel.getByTag('leadership');
  },

  async getLeadershipEventsWithParticipants(regionId = null) {
    // Get leadership events with their participant counts
    const events = await eventModel.getByTag('leadership');
    
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
            if (event.region_id) {
              participantCount = await userCountService.countUsersByRoleAndRegion(['rc', 'admin'], event.region_id);
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
