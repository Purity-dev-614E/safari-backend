const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../auth'); // Comment out this line
const groupController = require('../controllers/groupController');

// All attendance routes are protected (temporarily disabled authentication)
router.use(authenticate); // Comment out this line

router.post('/event/:eventId', attendanceController.createAttendance); // Event-specific create attendance
router.get('/:id', attendanceController.getAttendanceById);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

router.get('/week', attendanceController.getAttendanceByTimePeriod);
router.get('/month', attendanceController.getAttendanceByTimePeriod);
router.get('/year', attendanceController.getAttendanceByTimePeriod);

router.get('/event/:eventId/attended-members', attendanceController.getByAttendedUsers);
router.get('/status', attendanceController.getAttendanceStatus);

// Event attendance
router.get('/event/:eventId', attendanceController.getAttendanceByEvent);

// User attendance
router.get('/user/:userId', attendanceController.getAttendanceByUser);

// Fetch overall attendance by period
router.get('/', groupController.getOverallAttendanceByPeriod);

module.exports = router;