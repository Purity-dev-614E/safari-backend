const regionService = require('../services/regionService');

module.exports = {
  async createRegion(req, res) {
    try {
      const regionData = req.body;
      const result = await regionService.createRegion(regionData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating region:', error);
      res.status(500).json({ error: error.message || 'Failed to create region' });
    }
  },

  async getRegionById(req, res) {
    try {
      console.log('Fetching region by ID:', req.params.id);
      const { id } = req.params;
      const region = await regionService.getRegionById(id);
      
      if (!region) {
        console.log('Region not found for ID:', id);
        return res.status(404).json({ error: 'Region not found' });
      }
      
      console.log('Region fetched successfully:', region);
      res.status(200).json(region);
    } catch (error) {
      console.error('Error fetching region:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch region' });
    }
  },

  async updateRegion(req, res) {
    try {
      const { id } = req.params;
      const regionData = req.body;
      const result = await regionService.updateRegion(id, regionData);
      
      if (!result) {
        return res.status(404).json({ error: 'Region not found' });
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating region:', error);
      res.status(500).json({ error: error.message || 'Failed to update region' });
    }
  },

  async deleteRegion(req, res) {
    try {
      const { id } = req.params;
      const result = await regionService.deleteRegion(id);
      
      if (result === 0) {
        return res.status(404).json({ error: 'Region not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting region:', error);
      res.status(500).json({ error: error.message || 'Failed to delete region' });
    }
  },

  async getAllRegions(req, res) {
    try {
      const regions = await regionService.getAllRegions();
      console.log (regions);
      res.status(200).json(regions);
    } catch (error) {
      console.error('Error fetching regions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch regions' });
    }
  },

  async getUsersByRegion(req, res) {
    try {
      const { regionId } = req.params;
      const users = await regionService.getUsersByRegion(regionId);
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users by region:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch users by region' });
    }
  },

  async getGroupsByRegion(req, res) {
    try {
      const { regionId } = req.params;
      const groups = await regionService.getGroupsByRegion(regionId);
      res.status(200).json(groups);
    } catch (error) {
      console.error('Error fetching groups by region:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch groups by region' });
    }
  }
};