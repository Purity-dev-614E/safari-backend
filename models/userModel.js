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

  async getAllByRegion(regionId) {
    return db(table).where({ region_id: regionId }).select('*');
  },

  async updateProfilePicture(id, base64Image) {
    const fileName = await saveProfilePicture(base64Image, id);
    return db(table)
      .where({ id })
      .update({ profile_picture: fileName })
      .returning('*');
  },

  async updateUserRegion(id, regionId) {
    return db(table)
      .where({ id })
      .update({ region_id: regionId })
      .returning('*');
  },

  async getUsersByRole(role) {
    return db(table).where({ role }).select('*');
  },

  async getRegionManagers() {
    return db(table).where({ role: 'region_manager' }).select('*');
  }
};

async function saveProfilePicture(base64Image, userId) {
  // Check if the Base64 string includes a data URI prefix
  const matches = base64Image.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid Base64 image format');
  }

  const imageType = matches[1]; // e.g., 'png', 'jpeg', 'jpg'
  const base64Data = matches[2]; // The actual Base64 string without the prefix

  // Decode the Base64 string
  const buffer = Buffer.from(base64Data, 'base64');

  // Define the file path
  const fileName = `${userId}_profile_picture_${Date.now()}.${imageType}`;
  const filePath = path.join(__dirname, '../uploads', fileName);

  // Ensure the uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Save the image to the file system
  fs.writeFileSync(filePath, buffer);

  return fileName; // Return the file name to store in the database
}
