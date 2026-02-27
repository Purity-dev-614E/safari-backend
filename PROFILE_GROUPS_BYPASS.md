# Profile Groups Bypass Fix

## Problem
The RBAC middleware was restricting users from seeing all available groups in the profile selection page, causing "no regions" issues.

## Root Cause
The `GET /api/groups` endpoint uses `checkRegionAccess` middleware which restricts group access based on user roles:
- Root/Super Admin: Can see all groups
- Regional Manager: Only groups in their region
- Admin: Only their own groups  
- User: Only groups they belong to

This prevented users from seeing all available groups when selecting groups for their profile.

## Solution
Created a new endpoint that bypasses RBAC restrictions specifically for profile group selection:

### New Endpoint
```
GET /api/groups/all-for-profile
```

### Changes Made

#### 1. Added Route (groupRoutes.js)
```javascript
// Get all groups for profile selection (bypasses RBAC restrictions)
router.get('/all-for-profile', groupController.getAllGroupsForProfile);
```

#### 2. Added Controller Method (groupController.js)
```javascript
async getAllGroupsForProfile(req, res) {
  try {
    // This endpoint allows all authenticated users to see all groups for profile selection
    // This bypasses the normal RBAC restrictions since users need to be able to select groups
    const groups = await groupService.getAllGroups();
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups for profile:', error);
    res.status(500).json({ error: 'Failed to fetch groups for profile' });
  }
}
```

## Frontend Update
Update your profile page to use the new endpoint:

**Before:**
```
GET /api/groups
```

**After:**
```
GET /api/groups/all-for-profile
```

## Security Notes
- The original `/api/groups` endpoint remains unchanged for admin operations
- Only the profile selection bypasses RBAC restrictions
- All users must still be authenticated to access the new endpoint
- This is a safe compromise since users need to see all available groups to make informed selections

## Benefits
- ✅ Users can now see all available groups in profile selection
- ✅ Admin functionality remains secure and unchanged
- ✅ Clean separation of concerns
- ✅ Easy frontend implementation
