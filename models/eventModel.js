const db = require('../db');

const table = 'events';

module.exports = {
  async create(eventData) {
    return db(table).insert(eventData).returning('*');
  },
  
  async getById(id) {
    return db(table).where({ id }).first();
  },
  
  async update(id, eventData) {
    return db(table).where({ id }).update(eventData).returning('*');
  },
  
  async delete(id) {
    return db(table).where({ id }).del();
  },
  
  async getAll() {
    return db(table).select('*');
  },
  
  async getByGroup(groupId) {
    return db(table).where({ group_id: groupId }).select('*');
  },
  
  async getByRegion(regionId) {
    // Join with groups to filter events by region
    return db(table)
      .join('groups', 'events.group_id', 'groups.id')
      .where('groups.region_id', regionId)
      .select('events.*');
  },
  
  async getAllWithRegionInfo() {
    // Join with groups to include region information
    return db(table)
      .join('groups', 'events.group_id', 'groups.id')
      .leftJoin('regions', 'groups.region_id', 'regions.id')
      .select(
        'events.*',
        'groups.name as group_name',
        'groups.region_id',
        'regions.name as region_name'
      );
  }
};