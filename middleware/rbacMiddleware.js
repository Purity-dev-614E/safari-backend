const userModel = require('../models/userModel');

// Role hierarchy: root > super admin > regional manager > admin > user
const ROLE_HIERARCHY = {
  'root': 5,
  'super admin': 4,
  'regional manager': 3,
  'admin': 2,
  'user': 1
};

// Valid role values
const VALID_ROLES = ['root', 'super admin', 'regional manager', 'admin', 'user'];

/**
 * Normalize role names from various formats to canonical format
 */
const normalizeRole = (role) => {
  if (!role) return role;
  
  const roleMap = {
    'super_admin': 'super admin',
    'super-admin': 'super admin',
    'superadmin': 'super admin',
    'regional_manager': 'regional manager',
    'regional-manager': 'regional manager',
    'regionalmanager': 'regional manager',
    'group leader': 'admin',
    'group-leader': 'admin',
    'groupleader': 'admin'
  };
  
  // First normalize by trimming and lowercasing
  const normalized = role.toLowerCase().trim();
  
  // Check if it matches any role in the map first
  if (roleMap[normalized]) {
    return roleMap[normalized];
  }
  
  // If not found, remove underscores and check again
  const roleWithoutUnderscores = normalized.replace(/_/g, '');
  return roleMap[roleWithoutUnderscores] || roleWithoutUnderscores;
};

/**
 * Validate if a role is in the valid roles list
 */
const isValidRole = (role) => {
  const normalized = normalizeRole(role);
  return VALID_ROLES.includes(normalized);
};

/**
 * Check if user has sufficient role level
 */
const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Check if user can change target role based on RBAC rules
 */
const canChangeRole = (requesterRole, targetRole) => {
  // Only root can set or change root role
  if (targetRole === 'root') {
    return requesterRole === 'root';
  }
  
  // Only root can set or change super admin role
  if (targetRole === 'super admin') {
    return requesterRole === 'root';
  }
  
  // Super admin cannot change root or other super admin roles
  if (requesterRole === 'super admin') {
    return !['root', 'super admin'].includes(targetRole);
  }
  
  // Regional manager cannot change root, super admin, or other regional manager roles
  if (requesterRole === 'regional manager') {
    return !['root', 'super admin', 'regional manager'].includes(targetRole);
  }
  
  // Admin can only change user roles
  if (requesterRole === 'admin') {
    return targetRole === 'user';
  }
  
  // Users cannot change any roles
  return false;
};

/**
 * Middleware to validate role changes in requests
 */
const validateRoleChange = (req, res, next) => {
  const { role: newRole } = req.body;
  const { id: targetUserId } = req.params;
  
  // If no role change is being made, continue
  if (!newRole) {
    return next();
  }
  
  // Normalize the role
  const normalizedRole = normalizeRole(newRole);
  
  // Validate role format
  if (!isValidRole(normalizedRole)) {
    return res.status(400).json({ 
      error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` 
    });
  }
  
  // Get requester's role from authenticated user
  const requesterRole = req.fullUser?.role;
  
  if (!requesterRole) {
    return res.status(403).json({ error: 'User role not found' });
  }
  
  // Check if requester can change to this role
  if (!canChangeRole(requesterRole, normalizedRole)) {
    return res.status(403).json({ 
      error: `You don't have permission to assign role '${normalizedRole}'` 
    });
  }
  
  // Prevent self-role escalation (except for root)
  if (targetUserId === req.fullUser?.id && requesterRole !== 'root') {
    const currentLevel = ROLE_HIERARCHY[requesterRole] || 0;
    const newLevel = ROLE_HIERARCHY[normalizedRole] || 0;
    
    if (newLevel > currentLevel) {
      return res.status(403).json({ 
        error: 'You cannot promote yourself to a higher role' 
      });
    }
  }
  
  // Store normalized role back to request body
  req.body.role = normalizedRole;
  
  next();
};

/**
 * Middleware to require minimum role level
 */
const requireRole = (minimumRole) => {
  return (req, res, next) => {
    const userRole = req.fullUser?.role;
    
    if (!userRole) {
      return res.status(403).json({ error: 'User role not found' });
    }
    
    if (!hasRoleLevel(userRole, minimumRole)) {
      return res.status(403).json({ 
        error: `Requires minimum role: ${minimumRole}` 
      });
    }
    
    next();
  };
};

/**
 * Middleware to require exact role
 */
const requireExactRole = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.fullUser?.role;
    
    if (!userRole) {
      return res.status(403).json({ error: 'User role not found' });
    }
    
    if (userRole !== requiredRole) {
      return res.status(403).json({ 
        error: `Requires role: ${requiredRole}` 
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user can access data in their region
 */
const checkRegionAccess = async (req, res, next) => {
  const userRole = req.fullUser?.role;
  const userRegionId = req.fullUser?.region_id;
  
  // Root and super admin can access all regions
  if (['root', 'super admin'].includes(userRole)) {
    return next();
  }
  
  // Regional managers can only access their assigned regions
  if (userRole === 'regional manager') {
    // If no region_id is specified, they can only see their own region
    if (!req.query.region_id && !req.body.region_id) {
      req.query.region_id = userRegionId;
      return next();
    }
    
    const requestedRegionId = req.query.region_id || req.body.region_id;
    if (requestedRegionId !== userRegionId) {
      return res.status(403).json({ 
        error: 'You can only access data from your assigned region' 
      });
    }
  }
  
  // Admins can only access data from their group's region
  if (userRole === 'admin') {
    // This will be handled at the controller level with group checks
    return next();
  }
  
  // Users can only access their own data
  if (userRole === 'user') {
    // This will be handled at the controller level
    return next();
  }
  
  next();
};

module.exports = {
  ROLE_HIERARCHY,
  VALID_ROLES,
  normalizeRole,
  isValidRole,
  hasRoleLevel,
  canChangeRole,
  validateRoleChange,
  requireRole,
  requireExactRole,
  checkRegionAccess
};
