const knex = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const INACTIVITY_THRESHOLD_DAYS = 45;

module.exports = {
  /**
   * Check if a group is inactive based on its last event date
   * @param {string} groupId - Group UUID
   * @returns {Promise<boolean>} - true if inactive, false if active
   */
  async isGroupInactive(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }

    // Get the most recent event for this group
    const lastEvent = await knex('events')
      .where({ group_id: groupId })
      .orderBy('date', 'desc')
      .first();

    if (!lastEvent) {
      // No events at all → inactive
      return true;
    }

    // Check if last event was more than 45 days ago
    const lastEventDate = new Date(lastEvent.date);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_THRESHOLD_DAYS);

    return lastEventDate < cutoffDate;
  },

  /**
   * Get activity status for all groups
   * @param {string} regionId - Optional region filter
   * @returns {Promise<Array>} - Array of groups with activity status
   */
  async getAllGroupsActivityStatus(regionId = null) {
    const query = knex('groups')
      .select(
        'groups.id',
        'groups.name',
        'groups.region_id',
        'regions.name as region_name'
      )
      .leftJoin('regions', 'groups.region_id', 'regions.id');

    if (regionId) {
      query.where('groups.region_id', regionId);
    }

    const groups = await query;

    // Add activity status to each group
    const groupsWithStatus = await Promise.all(
      groups.map(async (group) => {
        const isInactive = await this.isGroupInactive(group.id);
        return {
          ...group,
          is_active: !isInactive,
          last_event_date: await this.getLastEventDate(group.id)
        };
      })
    );

    return groupsWithStatus;
  },

  /**
   * Get activity status for a specific group
   * @param {string} groupId - Group UUID
   * @returns {Promise<Object>} - Group with activity status
   */
  async getGroupActivityStatus(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }

    const group = await knex('groups')
      .select(
        'groups.id',
        'groups.name',
        'groups.region_id',
        'regions.name as region_name'
      )
      .leftJoin('regions', 'groups.region_id', 'regions.id')
      .where('groups.id', groupId)
      .first();

    if (!group) {
      throw new Error('Group not found');
    }

    const isInactive = await this.isGroupInactive(groupId);
    const lastEventDate = await this.getLastEventDate(groupId);

    return {
      ...group,
      is_active: !isInactive,
      last_event_date: lastEventDate
    };
  },

  /**
   * Get the date of the last event for a group
   * @param {string} groupId - Group UUID
   * @returns {Promise<Date|null>} - Date of last event or null if no events
   */
  async getLastEventDate(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }

    const lastEvent = await knex('events')
      .where({ group_id: groupId })
      .orderBy('date', 'desc')
      .first();

    return lastEvent ? new Date(lastEvent.date) : null;
  },

  /**
   * Get groups filtered by activity status
   * @param {boolean} active - true for active groups, false for inactive groups
   * @param {string} regionId - Optional region filter
   * @returns {Promise<Array>} - Array of groups matching the activity status
   */
  async getGroupsByActivityStatus(active = true, regionId = null) {
    const allGroups = await this.getAllGroupsActivityStatus(regionId);
    return allGroups.filter(group => group.is_active === active);
  }
};
