const eventModel = require("../models/eventModel");

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
};
