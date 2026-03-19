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
    return db(table);
  },
  
  async getByGroup(groupId) {
    return db(table).where({ group_id: groupId }).select('*');
  },
  
  async getByRegion(regionId) {
    // Get both group events and leadership events for this region
    const groupEvents = db(table)
      .join('groups', 'events.group_id', 'groups.id')
      .where('groups.region_id', regionId)
      .select('events.*');
    
    const leadershipEvents = db(table)
      .where({ 
        tag: 'leadership',
        regional_id: regionId 
      })
      .select('events.*');
    
    // Combine both results (this would need to be handled at the service layer)
    // For now, return group events to maintain backward compatibility
    return groupEvents;
  },
  
  async getByTag(tag) {
    return db(table).where({ tag }).select('*');
  },

  async getByGroupAndTag(groupId, tag) {
    return db(table).where({ group_id: groupId, tag }).select('*');
  },

  async getByRegionAndTag(regionId, tag) {
    return db(table)
      .join('groups', 'events.group_id', 'groups.id')
      .where('groups.region_id', regionId)
      .where('events.tag', tag)
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
  },

  async getLeadershipEventsByRegion(regionId) {
    // Get leadership events specifically created for this region
    return db(table)
      .where({ 
        tag: 'leadership',
        regional_id: regionId 
      })
      .select('*');
  }
};