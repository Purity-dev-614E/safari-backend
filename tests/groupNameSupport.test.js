const eventController = require('../controllers/eventController');
const groupService = require('../services/groupService');
const eventService = require('../services/eventService');

// Mock the services
jest.mock('../services/groupService');
jest.mock('../services/eventService');

describe('Event Controller - Group Name Support', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
  });

  test('should handle group name instead of ID for createEvent', async () => {
    mockReq = {
      params: { groupId: 'super_admin_group' }, // Group name, not UUID
      body: {
        title: 'Test Event',
        description: 'Test Description',
        date: '2026-02-28T10:00:00Z',
        location: 'Test Location',
        tag: 'org'
      },
      fullUser: { id: 'admin-id', role: 'admin', region_id: 'region-1' }
    };

    const mockGroup = { 
      id: 'real-uuid-here', 
      name: 'super_admin_group',
      group_admin_id: 'admin-id', 
      region_id: 'region-1' 
    };
    
    const mockResult = [{ id: 'event-id', ...mockReq.body, group_id: 'real-uuid-here' }];

    // Mock getGroupById to fail (UUID validation error)
    groupService.getGroupById.mockRejectedValue(new Error('Invalid UUID'));
    // Mock getGroupByName to succeed
    groupService.getGroupByName.mockResolvedValue(mockGroup);
    eventService.createEvent.mockResolvedValue(mockResult);

    await eventController.createEvent(mockReq, mockRes);

    // Since 'super_admin_group' is not a UUID format, it should call getGroupByName
    expect(groupService.getGroupById).not.toHaveBeenCalled();
    expect(groupService.getGroupByName).toHaveBeenCalledWith('super_admin_group');
    expect(eventService.createEvent).toHaveBeenCalledWith({
      ...mockReq.body,
      group_id: 'real-uuid-here'
    });
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult[0]);
  });

  test('should return 404 when group not found by either ID or name', async () => {
    mockReq = {
      params: { groupId: 'nonexistent_group' },
      body: { title: 'Test Event' },
      fullUser: { id: 'admin-id', role: 'admin' }
    };

    // Both lookups fail
    groupService.getGroupById.mockRejectedValue(new Error('Invalid UUID'));
    groupService.getGroupByName.mockResolvedValue(null);

    await eventController.createEvent(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Group not found' });
  });
});
