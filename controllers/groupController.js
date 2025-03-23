const groupService = require('../services/groupService');
const userService = require('../services/userService');
const attendanceService = require('../services/attendanceService');

module.exports = {
  async createGroup(req, res) {
    try {
      const groupData = req.body;
      const result = await groupService.createGroup(groupData);
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
      const groups = await groupService.getAllGroups();
      res.status(200).json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  },
  
  async getGroupMembers(req, res) {
    try {
      const { id } = req.params;
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

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await groupService.addGroupMember(id, userId);
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error adding group member:', error);
      res.status(500).json({ error: 'Failed to add group member' });
    }
  },
  
  async removeGroupMember(req, res) {
    try {
      const { id, userId } = req.params;
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
      const superAdminId = req.user.id; // Assuming req.user is set by the authenticate middleware

      // Check if the user is a super admin
      const superAdmin = await userService.getUserById(superAdminId);
      if (superAdmin.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can assign admins to groups' });
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
    const { period } = req.query;
    try {
      const attendance = await attendanceService.getAttendanceByGroupAndPeriod(id, period);
      res.status(200).json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  },

  // Fetch overall attendance by period
  async getOverallAttendanceByPeriod(req, res) {
    const { period } = req.query;
    console.log(`Fetching overall attendance for period: ${period}`);
    try {
      const attendance = await attendanceService.getOverallAttendanceByPeriod(period);
      res.status(200).json(attendance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  }
};