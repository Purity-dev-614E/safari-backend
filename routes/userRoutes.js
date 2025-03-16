const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../auth');




// Protected routes
router.get('/', authenticate, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.get('/email', authenticate, userController.getUserByEmail)
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

module.exports = router;
