const knex = require('../db');

class RemovedMembersModel {
  /**
   * Create a new removed member record
   * @param {Object} data - The removed member data
   * @param {string} data.group_id - The group ID
   * @param {string} data.user_id - The user ID being removed
   * @param {string} data.reason - The reason for removal
   * @param {string} data.removed_by - The user ID who performed the removal
   * @returns {Promise<Object>} The created removed member record
   */
  static async create(data) {
    const [removedMember] = await knex('group_removed_members')
      .insert({
        group_id: data.group_id,
        user_id: data.user_id,
        reason: data.reason,
        removed_by: data.removed_by
      })
      .returning('*');
    
    return removedMember;
  }

  /**
   * Get all removed members for a specific group
   * @param {string} groupId - The group ID
   * @returns {Promise<Array>} Array of removed members with user details
   */
  static async getByGroupId(groupId) {
    return await knex('group_removed_members as grm')
      .select([
        'grm.id',
        'grm.user_id',
        'grm.reason',
        'grm.removed_at',
        'grm.removed_by',
        'u.full_name',
        'u.email',
        'remover.full_name as removed_by_name',
        'remover.email as removed_by_email'
      ])
      .join('users as u', 'grm.user_id', 'u.id')
      .join('users as remover', 'grm.removed_by', 'remover.id')
      .where('grm.group_id', groupId)
      .orderBy('grm.removed_at', 'desc');
  }

  /**
   * Check if a user has been removed from a group
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object|null>} The removed member record or null
   */
  static async findByGroupAndUser(groupId, userId) {
    return await knex('group_removed_members')
      .where({
        group_id: groupId,
        user_id: userId
      })
      .first();
  }

  /**
   * Get removal history for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of removal records with group details
   */
  static async getByUserId(userId) {
    return await knex('group_removed_members as grm')
      .select([
        'grm.id',
        'grm.group_id',
        'grm.reason',
        'grm.removed_at',
        'grm.removed_by',
        'g.name as group_name',
        'remover.full_name as removed_by_name',
        'remover.email as removed_by_email'
      ])
      .join('groups as g', 'grm.group_id', 'g.id')
      .join('users as remover', 'grm.removed_by', 'remover.id')
      .where('grm.user_id', userId)
      .orderBy('grm.removed_at', 'desc');
  }

  /**
   * Get removal statistics for a group
   * @param {string} groupId - The group ID
   * @returns {Promise<Object>} Statistics object
   */
  static async getGroupStats(groupId) {
    const stats = await knex('group_removed_members')
      .where('group_id', groupId)
      .select(
        knex.raw('COUNT(*) as total_removed'),
        knex.raw('DATE_TRUNC(\'month\', removed_at) as month'),
        knex.raw('COUNT(*) as count')
      )
      .groupByRaw('DATE_TRUNC(\'month\', removed_at)')
      .orderBy('month', 'desc');

    const total = await knex('group_removed_members')
      .where('group_id', groupId)
      .count('* as total')
      .first();

    return {
      total_removed: parseInt(total.total),
      monthly_stats: stats
    };
  }

  /**
   * Delete a removed member record (for undo functionality)
   * @param {string} groupId - The group ID
   * @param {string} userId - The user ID
   * @returns {Promise<number>} Number of deleted records
   */
  static async delete(groupId, userId) {
    return await knex('group_removed_members')
      .where({
        group_id: groupId,
        user_id: userId
      })
      .del();
  }

  /**
   * Get all removed members with pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {string} options.groupId - Filter by group ID (optional)
   * @param {string} options.userId - Filter by user ID (optional)
   * @returns {Promise<Object>} Paginated results
   */
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      groupId,
      userId,
      sortBy = 'removed_at',
      sortOrder = 'desc'
    } = options;

    let query = knex('group_removed_members as grm')
      .select([
        'grm.id',
        'grm.group_id',
        'grm.user_id',
        'grm.reason',
        'grm.removed_at',
        'grm.removed_by',
        'u.full_name',
        'u.email',
        'g.name as group_name',
        'remover.full_name as removed_by_name',
        'remover.email as removed_by_email'
      ])
      .join('users as u', 'grm.user_id', 'u.id')
      .join('groups as g', 'grm.group_id', 'g.id')
      .join('users as remover', 'grm.removed_by', 'remover.id');

    // Apply filters
    if (groupId) {
      query = query.where('grm.group_id', groupId);
    }
    if (userId) {
      query = query.where('grm.user_id', userId);
    }

    // Apply sorting
    query = query.orderBy(`grm.${sortBy}`, sortOrder);

    // Get total count
    const countQuery = knex('group_removed_members as grm');
    if (groupId) countQuery.where('grm.group_id', groupId);
    if (userId) countQuery.where('grm.user_id', userId);
    const totalResult = await countQuery.count('* as total').first();
    const total = parseInt(totalResult.total);

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await query.limit(limit).offset(offset);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = RemovedMembersModel;
