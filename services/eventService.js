const eventModel = require("../models/eventModel");

module.exports = {
  async createEvent(eventData) {
    if (eventData.date_time) {
      const date = new Date(eventData.date_time);
      if (isNaN(date.getTime())) throw new Error("Invalid date format");

      // Store as UTC ISO8601 string
      eventData.date_time = date.toISOString(); // KEEP 'Z'
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
      eventData.date_time = date.toISOString(); // KEEP 'Z'
    }
    return eventModel.update(id, eventData);
  },

  async deleteEvent(id) {
    return eventModel.delete(id);
  },

  async getAllEvents() {
    return eventModel.getAll();
  },

  async getEventsByGroup(groupId) {
    return eventModel.getByGroup(groupId);
  },
};
