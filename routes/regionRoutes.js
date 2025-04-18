const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { authenticate } = require('../auth');
const { checkRole, checkRegionAccess } = require('../middleware/regionMiddleware');

router.use(authenticate);

// Routes accessible only to super admins
router.post('/', checkRole(['super admin']), regionController.createRegion);
router.put('/:id', checkRole(['super admin']), regionController.updateRegion);
router.delete('/:id', checkRole(['super admin']), regionController.deleteRegion);

// Routes accessible to super admins and region managers
router.get('/:id', checkRole(['super admin', 'region_manager']), regionController.getRegionById);
router.get('/:regionId/users', checkRole(['super admin', 'region_manager']), checkRegionAccess, regionController.getUsersByRegion);
router.get('/:regionId/groups', checkRole(['super admin', 'region_manager']), checkRegionAccess, regionController.getGroupsByRegion);

// Route accessible to all authenticated users for dropdown in frontend
router.get('/', regionController.getAllRegions);

module.exports = router;