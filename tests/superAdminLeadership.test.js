const eventController = require('../controllers/eventController');
const groupService = require('../services/groupService');
const eventService = require('../services/eventService');

// Mock services
jest.mock('../services/groupService');
jest.mock('../services/eventService');

describe('Super Admin Leadership Events', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
  });

  test('super admin can create leadership event with null group_id', async () => {
    mockReq = {
      params: { groupId: 'null' }, // Explicit null as string
      body: {
        title: 'Leadership Event',
        description: 'Super Admin Leadership Meeting',
        date: '2026-02-28T10:00:00Z',
        location: 'Virtual',
        tag: 'leadership'
      },
      fullUser: { id: 'super-admin-id', role: 'super admin', region_id: null }
    };

    // Mock group service to return null for null groupId
    groupService.getGroupByName.mockResolvedValue(null);
    groupService.getGroupById.mockResolvedValue(null);

    const mockResult = [{ id: 'event-id', ...mockReq.body, group_id: null }];

    eventService.createEvent.mockResolvedValue(mockResult);

    await eventController.createEvent(mockReq, mockRes);

    expect(groupService.getGroupById).not.toHaveBeenCalled();
    expect(groupService.getGroupByName).toHaveBeenCalledWith('null');
    expect(eventService.createEvent).toHaveBeenCalledWith({
      ...mockReq.body,
      group_id: null
    });
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult[0]);
  });

  test('super admin can create leadership event with actual null groupId', async () => {
    mockReq = {
      params: { groupId: null }, // Actual null value
      body: {
        title: 'Leadership Event',
        description: 'Super Admin Leadership Meeting',
        date: '2026-02-28T10:00:00Z',
        location: 'Virtual',
        tag: 'leadership'
      },
      fullUser: { id: 'super-admin-id', role: 'super admin', region_id: null }
    };

    const mockResult = [{ id: 'event-id', ...mockReq.body, group_id: null }];

    groupService.getGroupById.mockResolvedValue(null);
    groupService.getGroupByName.mockResolvedValue(null);
    eventService.createEvent.mockResolvedValue(mockResult);

    await eventController.createEvent(mockReq, mockRes);

    expect(eventService.createEvent).toHaveBeenCalledWith({
      ...mockReq.body,
      group_id: null
    });
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult[0]);
  });

  test('super admin can create regular org event with group', async () => {
    mockReq = {
      params: { groupId: '380896a5-0a83-4f69-947a-82b3975b05dd' },
      body: {
        title: 'Regular Event',
        description: 'Regular Org Event',
        date: '2026-02-28T10:00:00Z',
        location: 'Office',
        tag: 'org'
      },
      fullUser: { id: 'super-admin-id', role: 'super admin', region_id: null }
    };

    const mockGroup = { id: '380896a5-0a83-4f69-947a-82b3975b05dd' };
    const mockResult = [{ id: 'event-id', ...mockReq.body, group_id: '380896a5-0a83-4f69-947a-82b3975b05dd' }];

    groupService.getGroupById.mockResolvedValue(mockGroup);
    eventService.createEvent.mockResolvedValue(mockResult);

    await eventController.createEvent(mockReq, mockRes);

    expect(eventService.createEvent).toHaveBeenCalledWith({
      ...mockReq.body,
      group_id: '380896a5-0a83-4f69-947a-82b3975b05dd'
    });
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult[0]);
  });
});
