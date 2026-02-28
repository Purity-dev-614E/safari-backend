const eventController = require('../controllers/eventController');
const eventService = require('../services/eventService');
const groupService = require('../services/groupService');

// Mock the services
jest.mock('../services/eventService');
jest.mock('../services/groupService');

describe('Event Controller - Tag Functionality', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
  });

  describe('createEvent', () => {
    const baseEventData = {
      title: 'Test Event',
      description: 'Test Description',
      date: '2026-02-28T10:00:00Z',
      location: 'Test Location'
    };

    test('admin can create org events', async () => {
      mockReq = {
        params: { groupId: 'test-group-id' },
        body: { ...baseEventData, tag: 'org' },
        fullUser: { id: 'admin-id', role: 'admin', region_id: 'region-1' }
      };

      const mockGroup = { id: 'test-group-id', group_admin_id: 'admin-id', region_id: 'region-1' };
      const mockResult = [{ id: 'event-id', ...mockReq.body, group_id: 'test-group-id' }];

      groupService.getGroupById.mockResolvedValue(mockGroup);
      eventService.createEvent.mockResolvedValue(mockResult);

      await eventController.createEvent(mockReq, mockRes);

      expect(groupService.getGroupById).toHaveBeenCalledWith('test-group-id');
      expect(eventService.createEvent).toHaveBeenCalledWith({
        ...baseEventData,
        tag: 'org',
        group_id: 'test-group-id',
        date: '2026-02-28 10:00:00.000'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult[0]);
    });

    test('admin cannot create leadership events', async () => {
      mockReq = {
        params: { groupId: 'test-group-id' },
        body: { ...baseEventData, tag: 'leadership' },
        fullUser: { id: 'admin-id', role: 'admin', region_id: 'region-1' }
      };

      const mockGroup = { id: 'test-group-id', group_admin_id: 'admin-id', region_id: 'region-1' };
      groupService.getGroupById.mockResolvedValue(mockGroup);

      await eventController.createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied: Admins cannot create leadership events'
      });
      expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    test('regional manager can create leadership events in their region', async () => {
      mockReq = {
        params: { groupId: 'test-group-id' },
        body: { ...baseEventData, tag: 'leadership' },
        fullUser: { id: 'rm-id', role: 'regional manager', region_id: 'region-1' }
      };

      const mockGroup = { id: 'test-group-id', region_id: 'region-1' };
      const mockResult = [{ id: 'event-id', ...mockReq.body, group_id: 'test-group-id' }];

      groupService.getGroupById.mockResolvedValue(mockGroup);
      eventService.createEvent.mockResolvedValue(mockResult);

      await eventController.createEvent(mockReq, mockRes);

      expect(eventService.createEvent).toHaveBeenCalledWith({
        ...baseEventData,
        tag: 'leadership',
        group_id: 'test-group-id',
        date: '2026-02-28 10:00:00.000'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('regional manager cannot create leadership events outside their region', async () => {
      mockReq = {
        params: { groupId: 'test-group-id' },
        body: { ...baseEventData, tag: 'leadership' },
        fullUser: { id: 'rm-id', role: 'regional manager', region_id: 'region-1' }
      };

      const mockGroup = { id: 'test-group-id', region_id: 'region-2' }; // Different region
      groupService.getGroupById.mockResolvedValue(mockGroup);

      await eventController.createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied: Group not in your region'
      });
      expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    test('root can create any type of event', async () => {
      mockReq = {
        params: { groupId: 'test-group-id' },
        body: { ...baseEventData, tag: 'leadership' },
        fullUser: { id: 'root-id', role: 'root', region_id: null }
      };

      const mockGroup = { id: 'test-group-id' };
      const mockResult = [{ id: 'event-id', ...mockReq.body, group_id: 'test-group-id' }];

      groupService.getGroupById.mockResolvedValue(mockGroup);
      eventService.createEvent.mockResolvedValue(mockResult);

      await eventController.createEvent(mockReq, mockRes);

      expect(eventService.createEvent).toHaveBeenCalledWith({
        ...baseEventData,
        tag: 'leadership',
        group_id: 'test-group-id',
        date: '2026-02-28 10:00:00.000'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('user cannot create leadership events', async () => {
      mockReq = {
        params: { groupId: 'test-group-id' },
        body: { ...baseEventData, tag: 'leadership' },
        fullUser: { id: 'user-id', role: 'user', region_id: 'region-1' }
      };

      const mockGroup = { id: 'test-group-id' };
      groupService.getGroupById.mockResolvedValue(mockGroup);

      await eventController.createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied: Users cannot create leadership events'
      });
      expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    test('event defaults to org tag when not specified', async () => {
      mockReq = {
        params: { groupId: 'test-group-id' },
        body: baseEventData, // No tag specified
        fullUser: { id: 'admin-id', role: 'admin', region_id: 'region-1' }
      };

      const mockGroup = { id: 'test-group-id', group_admin_id: 'admin-id', region_id: 'region-1' };
      const mockResult = [{ id: 'event-id', ...baseEventData, tag: 'org', group_id: 'test-group-id' }];

      groupService.getGroupById.mockResolvedValue(mockGroup);
      eventService.createEvent.mockResolvedValue(mockResult);

      await eventController.createEvent(mockReq, mockRes);

      // The service should handle the default tag logic
      expect(eventService.createEvent).toHaveBeenCalledWith({
        ...baseEventData,
        group_id: 'test-group-id',
        date: '2026-02-28 10:00:00.000'
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getAllEvents', () => {
    test('users only see org events', async () => {
      mockReq = {
        fullUser: { id: 'user-id', role: 'user', region_id: 'region-1' },
        query: {}
      };

      const mockEvents = [
        { id: '1', tag: 'org', title: 'Org Event' },
        { id: '2', tag: 'leadership', title: 'Leadership Event' }
      ];

      eventService.getEventsByUserGroups.mockResolvedValue(mockEvents);

      await eventController.getAllEvents(mockReq, mockRes);

      expect(eventService.getEventsByUserGroups).toHaveBeenCalledWith('user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      // Check that only org events are returned
      const responseCalls = mockRes.json.mock.calls;
      const returnedEvents = responseCalls[0][0];
      expect(returnedEvents).toHaveLength(1);
      expect(returnedEvents[0].tag).toBe('org');
    });

    test('admins see all events in their groups', async () => {
      mockReq = {
        fullUser: { id: 'admin-id', role: 'admin', region_id: 'region-1' },
        query: {}
      };

      const mockEvents = [
        { id: '1', tag: 'org', title: 'Org Event' },
        { id: '2', tag: 'leadership', title: 'Leadership Event' }
      ];

      eventService.getEventsByAdminGroups.mockResolvedValue(mockEvents);

      await eventController.getAllEvents(mockReq, mockRes);

      expect(eventService.getEventsByAdminGroups).toHaveBeenCalledWith('admin-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEvents);
    });

    test('regional managers see all events in their region', async () => {
      mockReq = {
        fullUser: { id: 'rm-id', role: 'regional manager', region_id: 'region-1' },
        query: {}
      };

      const mockEvents = [
        { id: '1', tag: 'org', title: 'Org Event' },
        { id: '2', tag: 'leadership', title: 'Leadership Event' }
      ];

      eventService.getAllEvents.mockResolvedValue(mockEvents);

      await eventController.getAllEvents(mockReq, mockRes);

      expect(eventService.getAllEvents).toHaveBeenCalledWith('region-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEvents);
    });

    test('root sees all events', async () => {
      mockReq = {
        fullUser: { id: 'root-id', role: 'root', region_id: null },
        query: {}
      };

      const mockEvents = [
        { id: '1', tag: 'org', title: 'Org Event' },
        { id: '2', tag: 'leadership', title: 'Leadership Event' }
      ];

      eventService.getAllEvents.mockResolvedValue(mockEvents);

      await eventController.getAllEvents(mockReq, mockRes);

      expect(eventService.getAllEvents).toHaveBeenCalledWith(undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEvents);
    });
  });
});
