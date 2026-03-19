# Regional ID Implementation for Leadership Events

## Overview
This implementation adds `regional_id` support to the events table, specifically for leadership events created by regional managers.

## Changes Made

### 1. Database Migration
- **File**: `migrations/20250702000000_add_regional_id_to_events.js`
- **Changes**:
  - Added `regional_id` column to events table as UUID foreign key referencing regions table
  - Added check constraint to ensure `regional_id` is only set for leadership events
  - Constraint ensures data integrity: leadership events must have a regional_id, non-leadership events must not

### 2. Event Model Updates
- **File**: `models/eventModel.js`
- **Changes**:
  - Added `getLeadershipEventsByRegion(regionId)` method for direct regional queries
  - Updated `getByRegion()` method to handle both group-based and leadership events
  - Maintained backward compatibility with existing methods

### 3. Event Service Updates
- **File**: `services/eventService.js`
- **Changes**:
  - Enhanced `createEvent()` to validate `regional_id` for leadership events
  - Added requirement: leadership events must have `regional_id`
  - Updated `getLeadershipEvents()` to support regional filtering
  - Updated `getLeadershipEventsWithParticipants()` to use regional filtering
  - Fixed participant counting to use `regional_id` instead of `region_id`

### 4. Event Controller Updates
- **File**: `controllers/eventController.js`
- **Changes**:
  - Updated `createLeadershipEvent()` to automatically set `regional_id` based on user role
  - Regional managers: automatically assigned to their own region
  - Super admin/root: must specify `regional_id` in request
  - Added validation and logging for regional_id assignment

## Usage Examples

### Creating a Leadership Event (Regional Manager)
```javascript
POST /api/events/leadership
{
  "title": "Regional Leadership Meeting",
  "description": "Monthly leadership sync",
  "date": "2025-07-15T10:00:00Z",
  "location": "Regional Office",
  "tag": "leadership",
  "target_audience": "regional"
  // regional_id will be automatically set to manager's region
}
```

### Creating a Leadership Event (Super Admin)
```javascript
POST /api/events/leadership
{
  "title": "National Leadership Summit",
  "description": "Annual leadership conference",
  "date": "2025-07-15T10:00:00Z",
  "location": "National Venue",
  "tag": "leadership",
  "regional_id": "specific-region-uuid",
  "target_audience": "all"
}
```

### Getting Leadership Events by Region
```javascript
GET /api/events/leadership  // Regional managers see only their region's events
GET /api/events/leadership  // Super admins see all events
```

## Database Schema Changes

### Events Table
- **New Column**: `regional_id` (UUID, nullable)
- **Foreign Key**: References `regions.id`
- **Constraints**:
  - `regional_id` IS NOT NULL when `tag = 'leadership'`
  - `regional_id` IS NULL when `tag != 'leadership'`

## Backward Compatibility
- All existing event functionality remains unchanged
- Regular (non-leadership) events continue to work as before
- Leadership events created before this migration will need to be updated with regional_id

## Testing
- Created test file: `tests/regionalIdTest.js`
- Tests cover:
  - Creating leadership events with regional_id
  - Retrieving events by region
  - Validating regional_id assignment

## Migration Status
✅ Migration completed successfully
✅ All code changes implemented
✅ Test file created for verification

## Next Steps
1. Run the test suite to verify functionality
2. Update any existing leadership events to include regional_id
3. Update frontend to handle regional_id field
4. Add API documentation for the new regional_id parameter
