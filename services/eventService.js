const eventModel = require('../models/eventModel');

module.exports = {
  async createEvent(eventData) {
    return eventModel.create(eventData);
  },
  
  async getEventById(id) {
    return eventModel.getById(id);
  },
  
  async updateEvent(id, eventData) {
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
