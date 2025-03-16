const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../auth'); // Comment out this line

// All attendance routes are protected (temporarily disabled authentication)
router.use(authenticate); // Comment out this line

router.post('/event/:eventId', attendanceController.createAttendance); // Event-specific create attendance
router.get('/:id', attendanceController.getAttendanceById);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

app.get('/week', attendanceController.getAttendanceByTimePeriod);
app.get('/month', attendanceController.getAttendanceByTimePeriod);
app.get('/year', attendanceController.getAttendanceByTimePeriod);

// Event attendance
router.get('/event/:eventId', attendanceController.getAttendanceByEvent);

// User attendance
router.get('/user/:userId', attendanceController.getAttendanceByUser);

module.exports = router;