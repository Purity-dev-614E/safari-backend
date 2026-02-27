const userModel = require('../models/userModel');

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
  }
};
