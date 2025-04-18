const regionModel = require('../models/regionModel');

module.exports = {
  async createRegion(regionData) {
    return regionModel.createRegion(regionData);
  },

  async getRegionById(id) {
    return regionModel.getRegionById(id);
  },

  async getRegionByName(name) {
    return regionModel.getRegionByName(name);
  },

  async updateRegion(id, regionData) {
    return regionModel.updateRegion(id, regionData);
  },

  async deleteRegion(id) {
    return regionModel.deleteRegion(id);
  },

  async getAllRegions() {
    return regionModel.getAllRegions();
  },

  async getUsersByRegion(regionId) {
    return regionModel.getUsersByRegion(regionId);
  },

  async getGroupsByRegion(regionId) {
    return regionModel.getGroupsByRegion(regionId);
  }
};