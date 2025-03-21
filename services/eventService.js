const eventModel = require('../models/eventModel');

module.exports = {
  async createEvent(eventData) {
    // Ensure the date is correctly formatted
    if (eventData.date) {
      const date = new Date(eventData.date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      eventData.date = date.toISOString().replace('T', ' ').replace('Z', '');
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
        throw new Error('Invalid date format');
      }
      eventData.date = date.toISOString().replace('T', ' ').replace('Z', '');
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