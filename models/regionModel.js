const knex = require('../db');

// Define the predefined regions
const PREDEFINED_REGIONS = [
  'KILIMANI',
  'LANGATA',
  'EASTERN',
  'KIAMBU',
  'WESTLANDS',
  'DIASPORA',
  'INTERCOUNTY'
];

module.exports = {
  // Get the list of predefined regions
  getPredefinedRegions() {
    return PREDEFINED_REGIONS;
  },
  
  async createRegion(regionData) {
    try {
      // Ensure the region name is one of the predefined regions
      if (!regionData.name || !PREDEFINED_REGIONS.includes(regionData.name.toUpperCase())) {
        throw new Error(`Region name must be one of: ${PREDEFINED_REGIONS.join(', ')}`);
      }
      
      // Convert to uppercase to ensure consistency
      regionData.name = regionData.name.toUpperCase();
      
      const result = await knex('regions').insert(regionData).returning('*');
      return result[0];
    } catch (error) {
      console.error('Error creating region:', error);
      throw new Error(error.message || 'Failed to create region');
    }
  },

  async getRegionById(id) {
    try {
      const region = await knex('regions').where({ id }).first();
      return region;
    } catch (error) {
      console.error('Error fetching region by ID:', error);
      throw new Error('Failed to fetch region by ID');
    }
  },

  async getRegionByName(name) {
    try {
      const region = await knex('regions').where({ name }).first();
      return region;
    } catch (error) {
      console.error('Error fetching region by name:', error);
      throw new Error('Failed to fetch region by name');
    }
  },

  async updateRegion(id, regionData) {
    try {
      // If name is being updated, ensure it's one of the predefined regions
      if (regionData.name) {
        if (!PREDEFINED_REGIONS.includes(regionData.name.toUpperCase())) {
          throw new Error(`Region name must be one of: ${PREDEFINED_REGIONS.join(', ')}`);
        }
        
        // Convert to uppercase to ensure consistency
        regionData.name = regionData.name.toUpperCase();
      }
      
      const result = await knex('regions').where({ id }).update(regionData).returning('*');
      return result[0];
    } catch (error) {
      console.error('Error updating region:', error);
      throw new Error(error.message || 'Failed to update region');
    }
  },

  async deleteRegion(id) {
    try {
      const result = await knex('regions').where({ id }).del();
      return result;
    } catch (error) {
      console.error('Error deleting region:', error);
      throw new Error('Failed to delete region');
    }
  },

  async getAllRegions() {
    try {
      const regions = await knex('regions').select('*');
      return regions;
    } catch (error) {
      console.error('Error fetching all regions:', error);
      throw new Error('Failed to fetch all regions');
    }
  },

  async getUsersByRegion(regionId) {
    try {
      const users = await knex('users').where({ region_id: regionId }).select('*');
      return users;
    } catch (error) {
      console.error('Error fetching users by region:', error);
      throw new Error('Failed to fetch users by region');
    }
  },

  async getGroupsByRegion(regionId) {
    try {
      const groups = await knex('groups').where({ region_id: regionId }).select('*');
      return groups;
    } catch (error) {
      console.error('Error fetching groups by region:', error);
      throw new Error('Failed to fetch groups by region');
    }
  }
};