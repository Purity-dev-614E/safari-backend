const userService = require('../services/userService');
const { hasRoleLevel } = require('../middleware/rbacMiddleware');

module.exports = {
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check data access permissions
      const requesterRole = req.fullUser?.role;
      const requesterId = req.fullUser?.id;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Users can only see their own profile
      if (requesterRole === 'user' && requesterId !== id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Regional managers can only see users in their region
      if (requesterRole === 'regional_manager' && user.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: User not in your region' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
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
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ error: 'Name parameter is required' });
      }
      const user = await userService.getUserByName(name);
      if (!user || user.length === 0) {
        return res.status(404).json({ error: 'No users found' });
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
      const requesterRole = req.fullUser?.role;
      const requesterId = req.fullUser?.id;
      
      // Check if user exists and get current data
      const existingUser = await userService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Users can only update their own profile (except role)
      if (requesterRole === 'user' && requesterId !== id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Regular users cannot change their role
      if (requesterRole === 'user' && userData.role) {
        delete userData.role;
      }
      
      // Regional managers can only update users in their region
      if (requesterRole === 'regional_manager') {
        if (existingUser.region_id !== req.fullUser.region_id) {
          return res.status(403).json({ error: 'Access denied: User not in your region' });
        }
      }
      
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
      const requesterRole = req.fullUser?.role;
      
      // Check if user exists
      const existingUser = await userService.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Only root can delete root users
      if (existingUser.role === 'root' && requesterRole !== 'root') {
        return res.status(403).json({ error: 'Only root can delete root users' });
      }
      
      // Super admin cannot delete root users
      if (existingUser.role === 'root' && requesterRole === 'super_admin') {
        return res.status(403).json({ error: 'Cannot delete root users' });
      }
      
      // Regional managers can only delete users in their region
      if (requesterRole === 'regional_manager') {
        if (existingUser.region_id !== req.fullUser.region_id) {
          return res.status(403).json({ error: 'Access denied: User not in your region' });
        }
        // Cannot delete users with higher or equal roles
        if (['root', 'super_admin', 'regional_manager'].includes(existingUser.role)) {
          return res.status(403).json({ error: 'Cannot delete users with this role level' });
        }
      }
      
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
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      const regionId = req.query.region_id;
      
      let users;
      
      // Root and super admin can see all users
      if (['root', 'super_admin'].includes(requesterRole)) {
        users = await userService.getAllUsers(regionId);
      }
      // Regional managers can only see users in their region
      else if (requesterRole === 'regional_manager') {
        users = await userService.getAllUsers(requesterRegionId);
      }
      // Admins can only see users in their group (handled at service level)
      else {
        users = await userService.getUsersInAdminGroup(req.fullUser.id);
      }
      
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

    async updateProfilePicture(req, res) {
    try {
      const { id } = req.params; // User ID from the route parameter
      const { image } = req.body; // Base64 image from the request body
    
      if (!image) {
      console.error(`Error: Missing base64 image for user ID ${id}`);
      return res.status(400).json({ error: 'Base64 image is required' });
      }
    
      const result = await userService.updateProfilePicture(id, image);
      console.log(result);

      if (!result || result.length === 0) {
      console.error(`Error: User with ID ${id} not found`);
      return res.status(404).json({ error: 'User not found' });
      }
    
      res.status(200).json({
      message: 'Profile picture updated successfully',
      url: `/uploads/${result[0].profile_picture}`, // Return the image URL
      });
    } catch (error) {
      console.error(`Error updating profile picture for user ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update profile picture' });
    }
    }
};
