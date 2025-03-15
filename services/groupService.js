const groupModel = require('../models/groupModel');

module.exports = {
  async createGroup(groupData) {
    return groupModel.create(groupData);
  },
  
  async getGroupById(id) {
    return groupModel.getById(id);
  },

  async getGroupByName(name){
    return groupModel.getByName(name);
  },
  
  async updateGroup(id, groupData) {
    return groupModel.update(id, groupData);
  },
  
  async deleteGroup(id) {
    return groupModel.delete(id);
  },

  async assignAdminToGroup(groupId, userId) {
    return groupModel.assignAdmin(groupId, userId);
  },
  
  async getAllGroups() {
    return groupModel.getAll();
  },
  
  async getGroupMembers(groupId) {
    return groupModel.getMembers(groupId);
  },
  
  async addGroupMember(groupId, userId) {
    return groupModel.addMember(groupId, userId);
  },
  
  async removeGroupMember(groupId, userId) {
    return groupModel.removeMember(groupId, userId);
  }
};
