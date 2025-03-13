const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../auth'); // Uncomment this line

// All event routes are protected
router.use(authenticate); // Uncomment this line

router.post('/group/:groupId', eventController.createEvent); // Group-specific create event
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Group events
router.get('/group/:groupId', eventController.getEventsByGroup);

module.exports = router;