const db = require('../db');

module.exports = {
  async countUsersByRole(roles) {
    const result = await db('users')
      .whereIn('role', roles)
      .count('id as count')
      .first();
    return parseInt(result.count) || 0;
  },

  async countUsersByRoleAndRegion(roles, regionId) {
    const result = await db('users')
      .whereIn('role', roles)
      .where('region_id', regionId)
      .count('id as count')
      .first();
    return parseInt(result.count) || 0;
  }
};
