const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { authenticate } = require('../auth');
const { requireRole, requireExactRole, checkRegionAccess } = require('../middleware/rbacMiddleware');

router.use(authenticate);

// Routes accessible only to root and super admin
router.post('/', requireRole('super admin'), regionController.createRegion);
router.put('/:id', requireRole('super admin'), regionController.updateRegion);
router.delete('/:id', requireRole('super admin'), regionController.deleteRegion);

// Routes accessible to root, super admin, and regional managers
router.get('/:id', requireRole('regional manager'), regionController.getRegionById);
router.get('/:regionId/users', requireRole('regional manager'), checkRegionAccess, regionController.getUsersByRegion);
router.get('/:regionId/groups', requireRole('regional manager'), checkRegionAccess, regionController.getGroupsByRegion);

// Route accessible to all authenticated users for dropdown in frontend
router.get('/', regionController.getAllRegions);

module.exports = router;
