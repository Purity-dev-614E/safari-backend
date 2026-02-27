# Role Normalization Guide for Frontend Developers

## Overview

This document explains how role normalization works in the Safari Backend system and how frontend developers should handle roles when interacting with the API.

## Role Hierarchy

The system uses a hierarchical role structure with the following levels (highest to lowest):

```
root (Level 5)
├── super admin (Level 4)
├── regional manager (Level 3)
├── admin (Level 2)
└── user (Level 1)
```

## Canonical Role Names

The backend uses **canonical role names** that should be used consistently:

| Role | Display Name | Level | Description |
|------|--------------|-------|-------------|
| root | Root | 5 | System administrator with full access |
| super admin | Super Admin | 4 | Global administrator across all regions |
| regional manager | Regional Manager | 3 | Manages specific regions |
| admin | Admin | 2 | Group administrator |
| user | User | 1 | Regular user |

## Role Normalization Process

The backend automatically normalizes various role input formats to canonical names. This means you can send roles in different formats, and they'll be converted automatically.

### Supported Input Formats

| Canonical Name | Accepted Input Formats |
|---------------|------------------------|
| super admin | `super admin`, `super_admin`, `super-admin`, `superadmin` |
| regional manager | `regional manager`, `regional_manager`, `regional-manager`, `regionalmanager` |
| admin | `admin`, `group leader`, `group_leader`, `group-leader`, `groupleader` |
| user | `user` |
| root | `root` |

### Normalization Rules

1. **Case insensitive**: `Super Admin` → `super admin`
2. **Underscore handling**: `super_admin` → `super admin`
3. **Hyphen handling**: `super-admin` → `super admin`
4. **Concatenated handling**: `superadmin` → `super admin`
5. **Alias mapping**: `group leader` → `admin`

## Frontend Implementation Guidelines

### 1. Display Roles to Users

When displaying roles in the UI, use the **canonical names** with proper capitalization:

```javascript
// ✅ Correct - use canonical names
const roleDisplayMap = {
  'root': 'Root',
  'super admin': 'Super Admin',
  'regional manager': 'Regional Manager',
  'admin': 'Admin',
  'user': 'User'
};

// ❌ Incorrect - don't use normalized versions
const badRoleDisplayMap = {
  'super_admin': 'Super Admin',  // This won't match backend
  'regional_manager': 'Regional Manager'  // This won't match backend
};
```

### 2. Sending Roles to Backend

You can send roles in any accepted format, but **canonical names are preferred**:

```javascript
// ✅ Preferred - use canonical names
const userData = {
  role: 'super admin',
  // ... other fields
};

// ✅ Also works - will be normalized automatically
const userData = {
  role: 'super_admin',
  // ... other fields
};

// ❌ Avoid - non-standard formats
const userData = {
  role: 'SuperAdmin',  // Won't be normalized correctly
  // ... other fields
};
```

### 3. Role Comparison and Validation

When comparing roles in the frontend, always use canonical names:

```javascript
// ✅ Correct - compare with canonical names
if (user.role === 'super admin') {
  // Show super admin features
}

// ❌ Incorrect - comparing with non-canonical names
if (user.role === 'super_admin') {
  // This won't work as expected
}
```

### 4. Role Selection in Forms

When creating role selection dropdowns, use canonical names as values:

```html
<select name="role" id="role">
  <option value="user">User</option>
  <option value="admin">Admin</option>
  <option value="regional manager">Regional Manager</option>
  <option value="super admin">Super Admin</option>
  <option value="root">Root</option>
</select>
```

### 5. API Response Handling

The backend will always return canonical role names in API responses:

```json
{
  "id": "123",
  "email": "user@example.com",
  "role": "super admin",  // Always canonical
  "region_id": "456"
}
```

## Role-Based Access Control (RBAC)

### Permission Levels

Each role has specific permissions:

- **root**: Full system access, can manage all roles
- **super admin**: Global access, can manage regional managers and below
- **regional manager**: Region-specific access, can manage admins and users in their region
- **admin**: Group-specific access, can manage users in their groups
- **user**: Limited to own data

### Frontend Permission Checks

Use role hierarchy to determine UI visibility:

```javascript
// Role hierarchy for frontend checks
const ROLE_LEVELS = {
  'root': 5,
  'super admin': 4,
  'regional manager': 3,
  'admin': 2,
  'user': 1
};

// Check if user has sufficient role level
function hasMinimumRole(userRole, requiredRole) {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

// Usage examples
if (hasMinimumRole(currentUser.role, 'admin')) {
  // Show admin features
}

if (hasMinimumRole(currentUser.role, 'regional manager')) {
  // Show regional manager features
}
```

## Common Pitfalls to Avoid

### 1. Don't Cache Non-Canonical Roles

```javascript
// ❌ Wrong - caching non-canonical role
localStorage.setItem('userRole', 'super_admin');

// ✅ Correct - always store canonical role
localStorage.setItem('userRole', 'super admin');
```

### 2. Don't Hardcode Role Comparisons

```javascript
// ❌ Wrong - hardcoded role comparison
if (user.role === 'regional_manager' || user.role === 'regional manager') {
  // ...
}

// ✅ Correct - use canonical comparison
if (user.role === 'regional manager') {
  // ...
}
```

### 3. Don't Assume Role Format

```javascript
// ❌ Wrong - assuming role format
const roleParts = user.role.split(' '); // Might fail for "super_admin"

// ✅ Correct - handle canonical format
const roleParts = (user.role || '').split(' ');
```

## Testing Role Normalization

### Test Cases for Frontend

```javascript
// Test role display
const testRoles = [
  { input: 'super admin', expected: 'Super Admin' },
  { input: 'super_admin', expected: 'Super Admin' },
  { input: 'regional manager', expected: 'Regional Manager' },
  { input: 'admin', expected: 'Admin' },
  { input: 'user', expected: 'User' }
];

// Test role comparison
const roleTests = [
  { role: 'super admin', canAccess: 'admin', expected: true },
  { role: 'admin', canAccess: 'super admin', expected: false },
  { role: 'regional manager', canAccess: 'user', expected: true }
];
```

## API Examples

### Creating/Updating Users

```javascript
// POST /api/users
const newUser = {
  email: 'user@example.com',
  full_name: 'John Doe',
  role: 'admin',  // Use canonical name
  region_id: 'region-123'
};

// The backend will normalize this role automatically
```

### User Profile Response

```javascript
// GET /api/users/profile
// Response:
{
  "id": "user-123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "admin",  // Always canonical
  "region_id": "region-123",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Summary

1. **Always use canonical role names** in frontend code and API calls
2. **Store canonical names** when caching or persisting role data
3. **Compare with canonical names** when implementing permission checks
4. **Display canonical names** with proper capitalization in the UI
5. **Trust the backend normalization** but don't rely on it for frontend logic

Following these guidelines ensures consistent role handling across the entire application and prevents role-related bugs.
