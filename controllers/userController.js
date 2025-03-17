const userService = require('../services/userService');

module.exports = {
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user id' });
    }
  },

  async getUserByEmail(req, res){
    try {
      const { email } = req.params;
      const user = await userService.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
        } catch (error) {
          console.error('Error fetching user:', error);
          res.status(500).json({ error: 'Failed to fetch user' });
          }
  },

  async getUserByName(req, res){
    try {
      const { name } = req.params;
      const user = await userService.getUserByName(name);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
      } catch (error) {
          console.error('Error fetching user:', error);
          res.status(500).json({ error: 'Failed to fetch user' });
      }

  },
  
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const result = await userService.updateUser(id, userData);
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  },
  
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      
      if (result === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },
  
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  async updateProfilePicture(){
    try {
      const { id } = req.params;
      const { picture } = req.body;
      const result = await userService.updateProfilePicture(id, picture);
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(result[0]);

    } catch (error) {
          console.error('Error updating profile picture:', error);
          res.status(500).json({ error: 'Failed to update profile picture' });
    }
  }
};