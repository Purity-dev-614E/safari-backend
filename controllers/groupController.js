const groupService = require('../services/groupService');
const userService = require('../services/userService');
const attendanceService = require('../services/attendanceService');

module.exports = {
  async createGroup(req, res) {
    try {
      console.log('Creating group with data:', req.body);
      const groupData = req.body;
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Regional managers can only create groups in their region
      if (requesterRole === 'regional manager') {
        groupData.region_id = requesterRegionId;
      }
      
      // Admins can only create groups (no region restrictions needed as they're assigned to existing groups)
      
      const result = await groupService.createGroup(groupData);
      console.log('Group created successfully:', result[0]);
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  },
  
  async getGroupById(req, res) {
    try {
      const { id } = req.params;
      const group = await groupService.getGroupById(id);
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check access permissions
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Regional managers can only see groups in their region
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      res.status(200).json(group);
    } catch (error) {
      console.error('Error fetching group:', error);
      res.status(500).json({ error: 'Failed to fetch group' });
    }
  },

  async getGroupByName(req, res) {
    try {
      const { name } = req.query;
      const group = await groupService.getGroupByName(name);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check access permissions
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Regional managers can only see groups in their region
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      res.status(200).json(group);
    } catch (error) {
      console.error('Error fetching group:', error);
      res.status(500).json({ error: 'Failed to fetch group' });
    }
  },
  
  async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const groupData = req.body;
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Check if group exists and get current data
      const existingGroup = await groupService.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Regional managers can only update groups in their region
      if (requesterRole === 'regional manager' && existingGroup.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      // Admins can only update groups they administer
      if (requesterRole === 'admin' && existingGroup.group_admin_id !== req.fullUser.id) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }
      
      const result = await groupService.updateGroup(id, groupData);
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating group:', error);
      res.status(500).json({ error: 'Failed to update group' });
    }
  },
  
  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      const requesterRole = req.fullUser?.role;
      
      // Check if group exists
      const existingGroup = await groupService.getGroupById(id);
      if (!existingGroup) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Only root and super admin can delete groups
      if (!['root', 'super admin'].includes(requesterRole)) {
        return res.status(403).json({ error: 'Only root and super admin can delete groups' });
      }
      
      const result = await groupService.deleteGroup(id);
      
      if (result === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ error: 'Failed to delete group' });
    }
  },
  
  async getAllGroups(req, res) {
    try {
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      const regionId = req.query.region_id;
      
      let groups;
      
      // Root and super admin can see all groups
      if (['root', 'super admin'].includes(requesterRole)) {
        groups = await groupService.getAllGroups(regionId);
      }
      // Regional managers can only see groups in their region
      else if (requesterRole === 'regional manager') {
        groups = await groupService.getAllGroups(requesterRegionId);
      }
      // Admins can only see their own groups
      else if (requesterRole === 'admin') {
        groups = await groupService.getAdminGroups(req.fullUser.id);
      }
      // Users can only see groups they belong to
      else {
        groups = await groupService.getGroupByUserId(req.fullUser.id);
      }
      
      res.status(200).json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  },
  
  async getGroupMembers(req, res) {
    try {
      const { id } = req.params;
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Check if group exists and get data
      const group = await groupService.getGroupById(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      if (requesterRole === 'admin' && group.group_admin_id !== req.fullUser.id) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }
      
      const members = await groupService.getGroupMembers(id);
      res.status(200).json(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ error: 'Failed to fetch group members' });
    }
  },
  
  async addGroupMember(req, res) {
    try {
      const { id } = req.params; // Group ID
      const { userId } = req.body; // User ID from request body
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;

      console.log(`Adding member to group. Group ID: ${id}, User ID: ${userId}`);

      if (!userId) {
        console.warn('User ID is missing in request body');
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Check if group exists and get data
      const group = await groupService.getGroupById(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      if (requesterRole === 'admin' && group.group_admin_id !== req.fullUser.id) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }

      const result = await groupService.addGroupMember(id, userId);
      console.log(`Member added successfully to group. Result: ${JSON.stringify(result[0])}`);
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error adding group member:', error);
      res.status(500).json({ error: 'Failed to add group member' });
    }
  },
  
  async removeGroupMember(req, res) {
    try {
      const { id, userId } = req.params;
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Check if group exists and get data
      const group = await groupService.getGroupById(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      if (requesterRole === 'admin' && group.group_admin_id !== req.fullUser.id) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }
      
      await groupService.removeGroupMember(id, userId);
      res.status(204).end();
    } catch (error) {
      console.error('Error removing group member:', error);
      res.status(500).json({ error: 'Failed to remove group member' });
    }
  },

  async assignAdminToGroup(req, res) {
    try {
      const { groupId, userId } = req.body;
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;

      // Check if group exists and get data
      const group = await groupService.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Regional managers can only assign admins to groups in their region
      if (requesterRole === 'regional_manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }

      // Assign admin to group
      await groupService.assignAdminToGroup(groupId, userId);
      res.status(200).json({ message: 'Admin assigned to group successfully' });
    } catch (error) {
      console.error('Error assigning admin to group:', error);
      res.status(500).json({ error: 'Failed to assign admin to group' });
    }
  },

  async getGroupDemographics(req, res) {
    try {
      const { id } = req.params;
      const requesterRole = req.fullUser?.role;
      const requesterRegionId = req.fullUser?.region_id;
      
      // Check if group exists and get data
      const group = await groupService.getGroupById(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      if (requesterRole === 'admin' && group.group_admin_id !== req.fullUser.id) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }
      
      const demographics = await groupService.getGroupDemographics(id);
      res.status(200).json(demographics);
    } catch (error) {
      console.error('Error fetching group demographics:', error);
      res.status(500).json({ error: 'Failed to fetch group demographics' });
    }
  },

  async getAdminGroups(req, res) {
    try {
      const { userId } = req.params;
      console.log(`Fetching groups for admin userId: ${userId}`);
      const groups = await groupService.getAdminGroups(userId);
      console.log(`Fetched groups: ${JSON.stringify(groups)}`);
      res.status(200).json(groups);
    } catch (error) {
      console.error('Error fetching admin groups:', error);
      res.status(500).json({ error: 'Failed to fetch admin groups' });
    }
  },

  // Fetch attendance by group and period
  async getAttendanceByGroupAndPeriod(req, res) {
    const { id } = req.params;
    const { period } = req.query; // Changed from params to query
    const requesterRole = req.fullUser?.role;
    const requesterRegionId = req.fullUser?.region_id;
    
    try {
      // Check if group exists and get data
      const group = await groupService.getGroupById(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check access permissions
      if (requesterRole === 'regional manager' && group.region_id !== requesterRegionId) {
        return res.status(403).json({ error: 'Access denied: Group not in your region' });
      }
      
      if (requesterRole === 'admin' && group.group_admin_id !== req.fullUser.id) {
        return res.status(403).json({ error: 'Access denied: You are not the admin of this group' });
      }
      
      const attendance = await attendanceService.getAttendanceByGroupAndPeriod(id, period);
      res.status(200).json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  },

  // Fetch overall attendance by period
  async getOverallAttendanceByPeriod(req, res) {
    const { period } = req.params;
    console.log(`Fetching overall attendance for period: ${period}`);
    try {
      const attendance = await attendanceService.getOverallAttendanceByPeriod(period);
      console.log(attendance);
      res.status(200).json(attendance);
    } catch (error) {
      console.error('Error fetching overall attendance by period:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  },

  // Get groups by user ID
  async getGroupsByUserId(req, res) {
    try {
      const { userId } = req.params;
      console.log(`Fetching groups for userId: ${userId}`);
      const groups = await groupService.getGroupByUserId(userId);
      
      if (!groups || groups.length === 0) {
        return res.status(404).json({ error: 'No groups found for this user' });
      }
      
      res.status(200).json(groups);
    } catch (error) {
      console.error('Error fetching groups by user ID:', error);
      res.status(500).json({ error: 'Failed to fetch groups by user ID' });
    }
  }
// Get all groups for profile selection (bypasses RBAC restrictions)
  async getAllGroupsForProfile(req, res) {
    try {
      // This endpoint allows all authenticated users to see all groups for profile selection
      // This bypasses the normal RBAC restrictions since users need to be able to select groups
      const groups = await groupService.getAllGroups();
      res.status(200).json(groups);
    } catch (error) {
      console.error('Error fetching groups for profile:', error);
      res.status(500).json({ error: 'Failed to fetch groups for profile' });
    }
  }
};
