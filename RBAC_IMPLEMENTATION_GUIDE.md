# RBAC Implementation Guide

This document provides a comprehensive overview of the Role-Based Access Control (RBAC) system implemented in the Church Management API.

## Role Hierarchy

The system follows a strict role hierarchy:

```
Root (Developer) > Super Admin > Regional Manager > Admin (Group Leader) > User
```

### Role Levels

| Role | Level | Description | Permissions |
|------|-------|-------------|--------------|
| `root` | 5 | System developer/owner | Full system access, can manage all roles |
| `super_admin` | 4 | CEO/Executive | Can manage regions, groups, users (except root) |
| `regional_manager` | 3 | Regional overseer | Can manage groups/users in assigned region |
| `admin` | 2 | Group leader | Can manage own group and members |
| `user` | 1 | Regular member | Can manage own profile and view group data |

## Database Schema Changes

### Migration Files

1. **20250628000000_add_root_role_and_normalize_roles.js**
   - Adds `root` role to valid role constraints
   - Normalizes role names (e.g., 'super admin' → 'super_admin')
   - Updates both `users` and `users_groups` tables

2. **20250628000001_create_audit_logs_table.js**
   - Creates audit logging table for tracking role changes
   - Includes actor_id, user_id, action, old_value, new_value fields
   - Supports IP address and user agent tracking

### Valid Role Values

The system now uses normalized role names:
- `root`
- `super_admin`
- `regional_manager`
- `admin`
- `user`

## Middleware Implementation

### RBAC Middleware (`middleware/rbacMiddleware.js`)

#### Key Functions

1. **validateRoleChange**
   - Validates role change requests
   - Enforces role hierarchy rules
   - Prevents self-role escalation
   - Normalizes role names

2. **requireRole(minimumRole)**
   - Middleware to require minimum role level
   - Uses role hierarchy for access control

3. **requireExactRole(requiredRole)**
   - Middleware to require exact role match
   - For operations requiring specific role

4. **checkRegionAccess**
   - Enforces region-based access controls
   - Applies to regional managers and below

#### Role Change Rules

| Target Role | Root Can Change? | Super Admin Can Change? | Regional Manager Can Change? | Admin Can Change? |
|-------------|------------------|--------------------------|------------------------------|-------------------|
| root | Yes | No | No | No |
| super_admin | Yes | No | No | No |
| regional_manager | Yes | Yes | No | No |
| admin | Yes | Yes | Yes | No |
| user | Yes | Yes | Yes | Yes |

## Route Protection

### User Management (`/api/users`)

| Method | Route | Required Role | Additional Restrictions |
|--------|-------|---------------|----------------------|
| GET | `/` | admin | Region-based filtering |
| GET | `/:id` | user | Users can only see own profile |
| PUT | `/:id` | user | Role changes validated by RBAC |
| DELETE | `/:id` | super_admin | Cannot delete higher roles |

### Group Management (`/api/groups`)

| Method | Route | Required Role | Additional Restrictions |
|--------|-------|---------------|----------------------|
| POST | `/` | admin | Regional managers limited to their region |
| GET | `/` | user | Filtered by user's access level |
| PUT | `/:id` | admin | Only group admin can update |
| DELETE | `/:id` | super_admin | Full deletion only |

### Event Management (`/api/events`)

| Method | Route | Required Role | Additional Restrictions |
|--------|-------|---------------|----------------------|
| POST | `/group/:groupId` | admin | Group admin only |
| GET | `/` | user | Filtered by user's groups |
| PUT | `/:id` | admin | Group admin only |
| DELETE | `/:id` | admin | Group admin only |

### Region Management (`/api/regions`)

| Method | Route | Required Role | Additional Restrictions |
|--------|-------|---------------|----------------------|
| POST | `/` | super_admin | Root and super admin only |
| GET | `/:id` | regional_manager | Regional managers limited to own region |
| PUT | `/:id` | super_admin | Root and super admin only |
| DELETE | `/:id` | super_admin | Root and super admin only |

### Audit Logs (`/api/audit`)

| Method | Route | Required Role | Description |
|--------|-------|---------------|-------------|
| GET | `/` | admin | View all audit logs |
| GET | `/user/:userId` | admin | View specific user's audit logs |
| GET | `/role-changes` | admin | View all role change logs |

## Data Access Controls

### User Access

- **Root**: Full access to all data
- **Super Admin**: Full access except root user management
- **Regional Manager**: Access to data in assigned region only
- **Admin**: Access to own group's data only
- **User**: Access to own profile and group data

### Region-Based Filtering

The system automatically filters data based on user's region assignment:

```javascript
// Example: Regional manager can only see users in their region
if (requesterRole === 'regional_manager') {
  users = await userService.getAllUsers(requesterRegionId);
}
```

## Audit Logging

### Logged Events

1. **Role Changes**: All role modifications
2. **User Creation**: New user accounts
3. **User Deletion**: Account deletions
4. **Group Creation/Deletion**: Group management
5. **Region Creation/Deletion**: Region management

### Audit Log Structure

```javascript
{
  id: 'uuid',
  actor_id: 'user_who_made_change',
  user_id: 'target_user_id',
  action: 'ROLE_CHANGE',
  old_value: 'user',
  new_value: 'admin',
  ip_address: 'client_ip',
  user_agent: 'browser_info',
  metadata: { timestamp: '...', type: 'role_change' },
  created_at: 'timestamp'
}
```

## Security Features

### Input Validation

- Role names are validated against allowed values
- Role names are normalized to prevent variations
- Self-role escalation is prevented (except for root)

### Authentication Integration

- RBAC middleware works with existing authentication system
- User roles are loaded from database, not from request
- Session-based authentication required for all operations

### Error Handling

- Consistent 403 responses for access denied
- Detailed error messages for debugging
- Audit logging continues even if main operation fails

## Implementation Checklist

### ✅ Completed Features

1. **Role Hierarchy**: Complete 5-level role system
2. **Database Migration**: Role normalization and audit table
3. **Middleware**: Comprehensive RBAC validation
4. **Route Protection**: All endpoints properly secured
5. **Data Access**: Region and group-based filtering
6. **Audit Logging**: Complete audit trail for sensitive operations
7. **Self-Service Protection**: Users cannot escalate their own privileges

### 🔧 Configuration Required

1. **Run Migrations**: Apply database schema changes
2. **Update Existing Roles**: Normalize existing role data
3. **Assign Root User**: Create initial root user
4. **Configure Regions**: Set up regional structure
5. **Test Role Changes**: Verify all role transitions work correctly

## API Usage Examples

### Role Change (Super Admin)

```javascript
PUT /api/users/user-id
{
  "role": "admin"
}

// Headers
Authorization: Bearer <super_admin_token>
```

### Regional Manager Creating Group

```javascript
POST /api/groups
{
  "name": "New Group",
  "region_id": "region-uuid" // Automatically set to RM's region
}

// Headers
Authorization: Bearer <regional_manager_token>
```

### Viewing Audit Logs

```javascript
GET /api/audit/role-changes?limit=50

// Headers
Authorization: Bearer <admin_token>
```

## Testing Recommendations

1. **Role Transition Testing**: Test all valid role changes
2. **Access Control Testing**: Verify each role can only access allowed data
3. **Region Testing**: Test regional manager access boundaries
4. **Audit Log Testing**: Verify all sensitive operations are logged
5. **Edge Case Testing**: Test self-role escalation prevention

## Migration Steps

1. **Backup Database**: Before running migrations
2. **Run Role Migration**: `20250628000000_add_root_role_and_normalize_roles.js`
3. **Run Audit Migration**: `20250628000001_create_audit_logs_table.js`
4. **Create Root User**: Assign root role to system administrator
5. **Update Frontend**: Use new role names in UI
6. **Test All Features**: Verify RBAC functionality

## Troubleshooting

### Common Issues

1. **Role Not Recognized**: Check if migration normalized role names
2. **Access Denied**: Verify user has required role level
3. **Region Access**: Ensure user is assigned to correct region
4. **Audit Logs Missing**: Check if audit table was created

### Debug Commands

```sql
-- Check user roles
SELECT id, email, role, region_id FROM users;

-- Check audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;

-- Verify role constraints
SELECT conname, consrc FROM pg_constraint WHERE conname = 'role_check';
```

This implementation provides a robust, secure, and auditable RBAC system that enforces the principle of least privilege while maintaining flexibility for church management operations.
