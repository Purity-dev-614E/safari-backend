const db = require('../db');

const table = 'users';

module.exports = {
 
  async getById(id) {
    return db(table).where({ id }).first();
  },
  
  async getByEmail(email) {
    return db(table).where({ email }).first();
  },

  async getByName(full_name) {
    if (!full_name || typeof full_name !== 'string') {
        throw new Error('Invalid name format');
    }
    return db(table).whereILike('full_name', `%${full_name}%`);
  },

  
  async update(id, userData) {
    return db(table).where({ id }).update(userData).returning('*');
  },
  
  async delete(id) {
    return db(table).where({ id }).del();
  },
  
  async getAll() {
    return db(table).select('*');
  },

  async updateProfilePicture(){
    return db(table)
    .where({id})
    .update({profilePicture: req.file.filename})
    .returning('*');
  }
};
