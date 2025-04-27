# Analytics Structure

This document outlines the role-based analytics structure in the Safari application.

## Overview

The analytics functionality is organized by user role, with each role having access to a specific set of analytics endpoints:

1. **Super Admin**: Global access to all analytics across the entire system
2. **Regional Manager**: Access limited to analytics within their assigned region
3. **Admin (Group Admin)**: Access limited to analytics for their specific group(s)

## API Endpoints

### Super Admin Analytics

Base URL: `/api/super-admin/analytics`

Super admins have unrestricted access to all analytics data across the entire system.

#### Group Analytics
- `GET /groups/:groupId/demographics` - Get demographic breakdown of a group
- `GET /groups/:groupId/attendance` - Get attendance statistics for a group
- `GET /groups/:groupId/growth` - Get growth analytics for a group
- `POST /groups/compare` - Compare multiple groups

#### Attendance Analytics
- `GET /attendance/period/:period` - Get attendance statistics for a specific period (week, month, year)(3)
- `GET /attendance/overall/:period` - Get overall attendance statistics for a specific period(4)

#### Event Analytics
- `GET /events/:eventId/participation` - Get participation statistics for an event(2)
- `POST /events/compare-attendance` - Compare attendance across multiple events(8)

#### Member Analytics
- `GET /members/activity-status` - Get activity status for all members

#### Dashboard Analytics
- `GET /dashboard/summary` - Get overall dashboard summary (1)
- `GET /dashboard/group/:groupId` - Get dashboard data for a specific group (5)

### Regional Manager Analytics

Base URL: `/api/regional-manager/analytics`

Regional managers have access to analytics data only for their assigned region.

#### Group Analytics
- `GET /groups/:groupId/demographics` - Get demographic breakdown of a group in their region
- `GET /groups/:groupId/attendance` - Get attendance statistics for a group in their region
- `GET /groups/:groupId/growth` - Get growth analytics for a group in their region
- `POST /groups/compare` - Compare multiple groups within their region

#### Attendance Analytics
- `GET /attendance/period/:period` - Get attendance statistics for their region for a specific period(1)
- `GET /attendance/overall/:period` - Get overall attendance statistics for their region for a specific period(2)
- `GET /attendance/user/:userId` - Get attendance trends for a user in their region

#### Event Analytics
- `GET /events/:eventId/participation` - Get participation statistics for an event in their region
- `POST /events/compare-attendance` - Compare attendance across multiple events in their region

#### Member Analytics
- `GET /members/participation` - Get member participation statistics for their region(3)
- `GET /members/activity-status` - Get activity status for members in their region(4)

#### Dashboard Analytics
- `GET /dashboard/summary` - Get dashboard summary for their region(5)
- `GET /dashboard/group/:groupId` - Get dashboard data for a specific group in their region(6)

### Admin (Group Admin) Analytics

Base URL: `/api/admin/analytics`

Group admins have access to analytics data only for the groups they administer.

#### Group Analytics
- `GET /groups/:groupId/demographics` - Get demographic breakdown of their group(1)
- `GET /groups/:groupId/attendance` - Get attendance statistics for their group(2)
- `GET /groups/:groupId/growth` - Get growth analytics for their group

#### Attendance Analytics
- `GET /groups/:groupId/attendance/period/:period` - Get attendance statistics for their group for a specific period(3)

#### Event Analytics
- `GET /events/:eventId/participation` - Get participation statistics for an event in their group(4)

#### Member Analytics
- `GET /groups/:groupId/members/participation` - Get member participation statistics for their group(5)
- `GET /groups/:groupId/members/activity-status` - Get activity status for members in their group(6)

#### Dashboard Analytics
- `GET /groups/:groupId/dashboard` - Get dashboard data for their group(7)

## Implementation Details

The analytics functionality is implemented with a clear separation of concerns:

1. **Controllers**: Separate controller files for each role
   - `superAdminAnalyticsController.js`
   - `regionalManagerAnalyticsController.js`
   - `adminAnalyticsController.js`

2. **Routes**: Separate route files for each role
   - `superAdminAnalyticsRoutes.js`
   - `regionalManagerAnalyticsRoutes.js`
   - `adminAnalyticsRoutes.js`

3. **Models**: Role-specific analytics models
   - `analyticsModel.js` - Used by super admin for global analytics
   - `regionAnalyticsModel.js` - Used by regional managers for region-specific analytics
   - `adminAnalyticsModel.js` - Used by group admins for group-specific analytics

4. **Access Control**: Role-based middleware ensures users can only access analytics appropriate to their role
   - Super admins can access all analytics
   - Regional managers can only access analytics for their region
   - Group admins can only access analytics for their groups

## Frontend Integration

When integrating with the frontend:

1. Use the appropriate base URL for each user role
2. The frontend should determine which analytics endpoints to use based on the user's role
3. For super admins and regional managers, the analytics structure is similar, with the only difference being the scope (global vs. region)
4. For group admins, the analytics are focused on their specific group(s)