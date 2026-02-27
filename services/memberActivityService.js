const knex = require('../db');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const NO_APOLOGY_THRESHOLD = 6;
const TOTAL_ABSENCE_THRESHOLD = 12;

module.exports = {
  /**
   * Compute which members in a group should be marked as inactive
   * @param {string} groupId - Group UUID
   * @returns {Promise<Array>} - Array of user IDs that should be marked inactive
   */
  async computeMembersToMarkInactive(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }

    // Get all members of the group
    const groupMembers = await knex('users_groups')
      .where({ group_id: groupId })
      .select('user_id');

    if (groupMembers.length === 0) {
      return [];
    }

    // Get all events for the group, ordered by date (most recent first)
    const events = await knex('events')
      .where({ group_id: groupId })
      .orderBy('date', 'desc');

    if (events.length === 0) {
      // No events means all members are inactive
      return groupMembers.map(member => member.user_id);
    }

    const inactiveMembers = [];

    // Check each member's attendance pattern
    for (const member of groupMembers) {
      const shouldMarkInactive = await this.shouldMarkMemberInactive(member.user_id, events);
      if (shouldMarkInactive) {
        inactiveMembers.push(member.user_id);
      }
    }

    return inactiveMembers;
  },

  /**
   * Determine if a specific member should be marked inactive based on their attendance
   * @param {string} userId - User UUID
   * @param {Array} events - Array of events ordered by date (most recent first)
   * @returns {Promise<boolean>} - true if member should be marked inactive
   */
  async shouldMarkMemberInactive(userId, events) {
    let noApologyStreak = 0;
    let totalAbsenceStreak = 0;

    for (const event of events) {
      const attendance = await knex('attendance')
        .where({ 
          user_id: userId, 
          event_id: event.id 
        })
        .first();

      if (!attendance) {
        // No attendance record - treat as absence without apology
        noApologyStreak++;
        totalAbsenceStreak++;
      } else if (attendance.present) {
        // Member was present - reset both streaks
        noApologyStreak = 0;
        totalAbsenceStreak = 0;
      } else {
        // Member was absent
        totalAbsenceStreak++;
        
        // Check if there's an apology
        if (!attendance.apology || attendance.apology.trim() === '') {
          noApologyStreak++;
        } else {
          // Has apology - reset no-apology streak but continue total absence streak
          noApologyStreak = 0;
        }
      }

      // Check thresholds
      if (noApologyStreak >= NO_APOLOGY_THRESHOLD || totalAbsenceStreak >= TOTAL_ABSENCE_THRESHOLD) {
        return true;
      }
    }

    return false;
  },

  /**
   * Get activity status for all members of a group
   * @param {string} groupId - Group UUID
   * @returns {Promise<Array>} - Array of members with their activity status
   */
  async getGroupMemberActivityStatus(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }

    // Get all members with their current status
    const members = await knex('users_groups')
      .join('users', 'users_groups.user_id', 'users.id')
      .where('users_groups.group_id', groupId)
      .select(
        'users.id',
        'users.full_name',
        'users.email',
        'users_groups.is_active as current_status',
        'users_groups.role'
      );

    // Get computed activity status for each member
    const membersWithStatus = await Promise.all(
      members.map(async (member) => {
        const events = await knex('events')
          .where({ group_id: groupId })
          .orderBy('date', 'desc');

        const computedStatus = await this.shouldMarkMemberInactive(member.id, events);
        
        return {
          ...member,
          computed_is_active: !computedStatus,
          status_matches: member.current_status === !computedStatus
        };
      })
    );

    return membersWithStatus;
  },

  /**
   * Update member activity status for a group
   * @param {string} groupId - Group UUID
   * @param {string} userId - User UUID
   * @param {boolean} isActive - New activity status
   * @returns {Promise<Object>} - Updated record
   */
  async updateMemberActivityStatus(groupId, userId, isActive) {
    if (!uuidValidate(groupId) || !uuidValidate(userId)) {
      throw new Error('Invalid UUID format');
    }

    const result = await knex('users_groups')
      .where({ 
        group_id: groupId, 
        user_id: userId 
      })
      .update({ 
        is_active: isActive,
        updated_at: new Date()
      })
      .returning('*');

    if (result.length === 0) {
      throw new Error('User is not a member of this group');
    }

    return result[0];
  },

  /**
   * Check and mark inactive members after attendance is recorded
   * @param {string} groupId - Group UUID
   * @returns {Promise<Array>} - Array of members who were marked inactive
   */
  async checkAndMarkInactiveAfterAttendance(groupId) {
    if (!uuidValidate(groupId)) {
      throw new Error('Invalid UUID format');
    }

    const membersToMarkInactive = await this.computeMembersToMarkInactive(groupId);
    const markedMembers = [];

    for (const userId of membersToMarkInactive) {
      try {
        await this.updateMemberActivityStatus(groupId, userId, false);
        markedMembers.push(userId);
      } catch (error) {
        console.error(`Failed to mark user ${userId} inactive in group ${groupId}:`, error);
      }
    }

    return markedMembers;
  },

  /**
   * Reactivate a member when they attend an event
   * @param {string} groupId - Group UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} - Updated record
   */
  async reactivateMemberOnAttendance(groupId, userId) {
    return this.updateMemberActivityStatus(groupId, userId, true);
  }
};
