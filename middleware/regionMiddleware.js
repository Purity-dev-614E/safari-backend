const userModel = require('../models/userModel');

// Middleware to check user role
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get the user from the database using the auth_id from req.user
      const user = await userModel.getByEmail(req.user.email);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if the user's role is in the allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }
      
      // Add the full user object to the request for use in other middleware/controllers
      req.fullUser = user;
      next();
    } catch (error) {
      console.error('Error in checkRole middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Middleware to check region access
const checkRegionAccess = async (req, res, next) => {
  try {
    // If user is a super admin, allow access to all regions
    if (req.fullUser.role === 'super admin') {
      return next();
    }
    
    // For region managers, check if they're trying to access their own region
    if (req.fullUser.role === 'regional manager') {
      const regionId = req.params.regionId || req.body.region_id;
      
      if (!regionId) {
        return res.status(400).json({ error: 'Region ID is required' });
      }
      
      if (req.fullUser.region_id !== regionId) {
        return res.status(403).json({ error: 'Access denied. You can only access your assigned region.' });
      }
    }
    
    // For regular users, add their region_id to the request for filtering
    req.userRegionId = req.fullUser.region_id;
    next();
  } catch (error) {
    console.error('Error in checkRegionAccess middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to inject region filtering for queries
const injectRegionFilter = async (req, res, next) => {
  try {
    // Get the user from the database using the auth_id from req.user
    const user = await userModel.getByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add the full user object to the request
    req.fullUser = user;
    
    // If user is a super admin, no region filtering needed
    if (user.role === 'super admin') {
      req.bypassRegionCheck = true;
      return next();
    }
    
    // For region managers and regular users, add their region_id to the request for filtering
    req.userRegionId = user.region_id;
    next();
  } catch (error) {
    console.error('Error in injectRegionFilter middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  checkRole,
  checkRegionAccess,
  injectRegionFilter
};