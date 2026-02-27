const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../auth');
const { validateRoleChange, requireRole, checkRegionAccess } = require('../middleware/rbacMiddleware');

router.use(authenticate);

// Protected routes with RBAC
router.get('/', checkRegionAccess, requireRole('admin'), userController.getAllUsers);
router.get('/search', checkRegionAccess, requireRole('admin'), userController.getUserByName);
router.get('/:id', userController.getUserById);
router.get('/:email', userController.getUserByEmail);
router.put('/:id', validateRoleChange, userController.updateUser);
router.delete('/:id', requireRole('super_admin'), userController.deleteUser);
router.put('/:id/uploadimage', userController.updateProfilePicture);

module.exports = router;
