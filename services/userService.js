const userModel = require('../models/userModel');
const db = require('../db');

module.exports = {
  
  async getUserById(id) {
    return userModel.getById(id);
  },
  
  async getUserByEmail(email) {
    return userModel.getByEmail(email);
  },

  async getUserByName(full_name){
    return userModel.getByName(full_name);
  },
  
  async updateUser(id, userData) {
    return userModel.update(id, userData);
  },
  
  async deleteUser(id) {
    return userModel.delete(id);
  },

  async deleteUserCompletely(id) {
    const { supabaseAdmin } = require('../auth');
    
    try {
      // First, get the user from backend to get auth info
      const user = await userModel.getById(id);
      if (!user) {
        throw new Error('User not found in backend database');
      }

      // Delete from Supabase auth first
      if (user.auth_id) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.auth_id);
        if (authError) {
          console.error('Failed to delete user from Supabase auth:', authError);
          throw new Error(`Failed to delete from Supabase auth: ${authError.message}`);
        }
      }

      // Delete from backend database (cascade will handle related records)
      const result = await userModel.delete(id);
      
      return {
        backendDeleted: result,
        authDeleted: true,
        message: 'User completely deleted from both backend and auth'
      };
    } catch (error) {
      console.error('Complete user deletion failed:', error);
      throw error;
    }
  },
  
  async getAllUsers(regionId = null) {
    if (regionId) {
      return userModel.getAllByRegion(regionId);
    }
    return userModel.getAll();
  },

  async getUsersInAdminGroup(adminId) {
    // This would need to be implemented based on your group structure
    // For now, return all users (this should be restricted in production)
    return userModel.getAll();
  },

  async canAdminUpdateUser(adminId, targetUserId) {
    // This would need to be implemented based on your group structure
    // Check if target user is in the admin's group
    return true; // Placeholder
  },

  async updateProfilePicture(id, base64Image) {
    return userModel.updateProfilePicture(id, base64Image);
  },

  async getLeadershipEventParticipants(targetAudience = 'all', regionId = null) {
    // Get RCs (Regional Conferences) and admins based on target audience
    const baseQuery = db('users')
      .select('id', 'full_name', 'email', 'role', 'region_id')
      .whereIn('role', ['rc', 'admin']);

    switch (targetAudience) {
      case 'rc_only':
        return baseQuery.where('role', 'rc');
      
      case 'regional':
        if (!regionId) {
          throw new Error('Region ID is required for regional target audience');
        }
        return baseQuery.where('region_id', regionId);
      
      case 'all':
      default:
        return baseQuery;
    }
  }
};
