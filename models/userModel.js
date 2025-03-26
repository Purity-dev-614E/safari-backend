const db = require('../db');
const fs = require('fs');
const path = require('path');

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

  async updateProfilePicture(id, base64Image) {
      const fileName = await saveProfilePicture(base64Image, id);
      return db(table)
        .where({ id })
        .update({ profilePicture: fileName })
        .returning('*');
    },
};

async function saveProfilePicture(base64Image, userId) {
  const buffer = Buffer.from(base64Image, 'base64');
  const fileName = `${userId}_profile_picture_${Date.now()}.png`;
  const filePath = path.join(__dirname, '../uploads', fileName);

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  fs.writeFileSync(filePath, buffer);
  return fileName;
}
