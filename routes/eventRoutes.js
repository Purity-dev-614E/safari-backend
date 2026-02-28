const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../auth');
const { requireRole, checkRegionAccess } = require('../middleware/rbacMiddleware');

// All event routes are protected
router.use(authenticate);

// Event CRUD operations with RBAC
router.post('/leadership', requireRole('regional manager'), eventController.createLeadershipEvent); // Leadership events (no group required)
router.post('/group/:groupId', requireRole('admin'), eventController.createEvent); // Group-specific create event
router.get('/', checkRegionAccess, eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', requireRole('admin'), eventController.updateEvent);
router.delete('/:id', requireRole('admin'), eventController.deleteEvent);

// Group events
router.get('/group/:groupId', eventController.getEventsByGroup);

module.exports = router;
