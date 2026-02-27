const express = require('express');
const router = express.Router();
const auditLogService = require('../services/auditLogService');
const { authenticate } = require('../auth');
const { requireRole } = require('../middleware/rbacMiddleware');

// All audit routes are protected and require admin access
router.use(authenticate);
router.use(requireRole('admin'));

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await auditLogService.getAuditLogs(limit);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit logs for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const logs = await auditLogService.getUserAuditLogs(userId, limit);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch user audit logs' });
  }
});

// Get role change logs
router.get('/role-changes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await auditLogService.getRoleChangeLogs(limit);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching role change logs:', error);
    res.status(500).json({ error: 'Failed to fetch role change logs' });
  }
});

module.exports = router;
