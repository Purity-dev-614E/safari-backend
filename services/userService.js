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
  
  async getAllUsers() {
    return userModel.getAll();
  },

  async updateProfilePicture(){
    return userModel.updateProfilePicture
  }
};
