# Leadership Events API Update

## Overview

The backend has been updated to properly handle leadership events (such as RCs - Regional Conferences) with a separate API endpoint. Leadership events now require `group_id` to be `null` as per the new database constraint.

## Key Changes

### 1. New Dedicated Endpoint for Leadership Events

**Endpoint:** `POST /api/events/leadership`

**Purpose:** Create leadership events without requiring a group association

**Authentication:** Required (Bearer token)

**Authorization:** 'super admin', 'root', and 'regional manager' roles can create leadership events

### 2. Updated Regular Events Endpoint

**Endpoint:** `POST /api/events/group/:groupId`

**Change:** Now rejects leadership events and directs to use the `/leadership` endpoint

## API Specifications

### Leadership Events Creation

```http
POST /api/events/leadership
Authorization: Bearer <valid-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string", 
  "date": "ISO 8601 datetime string",
  "location": "string",
  "tag": "leadership"
}
```

**Important Notes:**
- `tag` must be exactly `"leadership"`
- `group_id` is automatically set to `null` by the backend
- Do not include `group_id` in the request body

**Success Response (201):**
```json
{
  "id": "uuid",
  "title": "Leadership Event Title",
  "description": "Event description",
  "date": "2026-02-28T13:46:00.000Z",
  "location": "Event location",
  "tag": "leadership",
  "group_id": null,
  "created_at": "2026-02-28T13:46:00.000Z",
  "updated_at": "2026-02-28T13:46:00.000Z"
}
```

**Error Responses:**
- `400` - Invalid tag or non-leadership event data
- `401` - Authentication required
- `403` - Insufficient permissions (not super admin, root, or regional manager)
- `500` - Server error

### Regular Group Events Creation (Unchanged)

```http
POST /api/events/group/:groupId
Authorization: Bearer <valid-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "date": "ISO 8601 datetime string", 
  "location": "string",
  "tag": "org" // or any non-leadership tag
}
```

**Error Responses:**
- `400` - Leadership events not allowed on this endpoint
- `404` - Group not found
- `403` - Access denied (insufficient permissions)

## Frontend Implementation Guide

### 1. Update Event Creation Form

**Conditional Logic:**
```javascript
// When user selects event type/tag
if (eventTag === 'leadership') {
  // Hide group selection
  // Use leadership endpoint
  endpoint = '/api/events/leadership';
} else {
  // Show group selection
  // Use group endpoint  
  endpoint = `/api/events/group/${selectedGroupId}`;
}
```

### 2. API Service Functions

**Leadership Events:**
```javascript
async function createLeadershipEvent(eventData) {
  const response = await fetch('/api/events/leadership', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...eventData,
      tag: 'leadership'
      // Do not include group_id
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create leadership event');
  }
  
  return response.json();
}
```

**Regular Events:**
```javascript
async function createGroupEvent(groupId, eventData) {
  const response = await fetch(`/api/events/group/${groupId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...eventData,
      tag: eventData.tag // Must not be 'leadership'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create event');
  }
  
  return response.json();
}
```

### 3. UI/UX Considerations

**Event Type Selection:**
- Add radio buttons or dropdown for event type
- Options: "Leadership Event" vs "Group Event"
- Show/hide group selection based on choice

**Permission Handling:**
- Show "Leadership Event" option for users with 'super admin', 'root', or 'regional manager' roles
- Display appropriate error messages for unauthorized users

**Form Validation:**
- Leadership events: No group selection required
- Regular events: Group selection mandatory
- Validate date format (ISO 8601)

### 4. Error Handling

**Common Error Messages:**
```javascript
const errorMessages = {
  400: {
    'Leadership events must be created using the /api/events/leadership endpoint': 
      'Please select "Leadership Event" type to create this event',
    'This endpoint only accepts leadership events':
      'Leadership events cannot be created as group events',
    'Only super admin, root, and regional managers can create leadership events':
      'You do not have permission to create leadership events'
  },
  403: 'Access denied - insufficient permissions',
  404: 'Group not found - please select a valid group',
  401: 'Please log in to create events',
  500: 'Server error - please try again later'
};
```

## Migration Steps

1. **Update API service layer** with new endpoint functions
2. **Modify event creation form** to handle both event types
3. **Add role-based UI** for leadership event creation
4. **Update error handling** with new error messages
5. **Test both endpoints** with different user roles
6. **Update documentation** and user guides

## Testing Checklist

- [ ] Leadership events can be created by super admin/root users
- [ ] Leadership events automatically have `group_id: null`
- [ ] Regular events still work with group selection
- [ ] Leadership events are rejected on group endpoint
- [ ] Regular events are rejected on leadership endpoint
- [ ] Proper error messages are displayed
- [ ] Role-based permissions are enforced
- [ ] Form validation works correctly

## Support

For any questions or issues during implementation, contact the backend team.

---

**Version:** 1.0  
**Date:** 2026-02-28  
**Backend Version:** Compatible with latest API changes
