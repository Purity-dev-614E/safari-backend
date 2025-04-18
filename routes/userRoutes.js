const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../auth');

router.use(authenticate);

// Protected routes
router.get('/',  userController.getAllUsers);
router.get('/search', userController.getUserByName);
router.get('/:id',  userController.getUserById);
router.get('/:email',  userController.getUserByEmail);
router.put('/:id',  userController.updateUser);
router.delete('/:id',  userController.deleteUser);
router.put('/:id/uploadimage', userController.updateProfilePicture);

module.exports = router;
