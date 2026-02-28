const eventService = require('../services/eventService');
const eventModel = require('../models/eventModel');

// Mock the eventModel
jest.mock('../models/eventModel');

describe('Event Service - Tag Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    const baseEventData = {
      title: 'Test Event',
      description: 'Test Description',
      date_time: '2026-02-28T10:00:00Z',
      group_id: 'test-group-id'
    };

    test('should set default tag to org when not provided', async () => {
      const mockResult = [{ id: 'test-id', ...baseEventData, tag: 'org' }];
      eventModel.create.mockResolvedValue(mockResult);

      const result = await eventService.createEvent(baseEventData);

      expect(eventModel.create).toHaveBeenCalledWith({
        ...baseEventData,
        tag: 'org'
      });
      expect(result).toEqual(mockResult);
    });

    test('should preserve provided org tag', async () => {
      const eventDataWithOrgTag = { ...baseEventData, tag: 'org' };
      const mockResult = [{ id: 'test-id', ...eventDataWithOrgTag }];
      eventModel.create.mockResolvedValue(mockResult);

      const result = await eventService.createEvent(eventDataWithOrgTag);

      expect(eventModel.create).toHaveBeenCalledWith(eventDataWithOrgTag);
      expect(result).toEqual(mockResult);
    });

    test('should preserve provided leadership tag', async () => {
      const eventDataWithLeadershipTag = { ...baseEventData, tag: 'leadership' };
      const mockResult = [{ id: 'test-id', ...eventDataWithLeadershipTag }];
      eventModel.create.mockResolvedValue(mockResult);

      const result = await eventService.createEvent(eventDataWithLeadershipTag);

      expect(eventModel.create).toHaveBeenCalledWith(eventDataWithLeadershipTag);
      expect(result).toEqual(mockResult);
    });

    test('should reject invalid tag values', async () => {
      const eventDataWithInvalidTag = { ...baseEventData, tag: 'invalid-tag' };

      await expect(eventService.createEvent(eventDataWithInvalidTag))
        .rejects
        .toThrow('Invalid tag value. Must be \'org\' or \'leadership\'');
      
      expect(eventModel.create).not.toHaveBeenCalled();
    });

    test('should handle date formatting correctly', async () => {
      const eventDataWithDate = {
        ...baseEventData,
        date_time: '2026-02-28T10:00:00Z'
      };
      const mockResult = [{ id: 'test-id', ...eventDataWithDate, tag: 'org' }];
      eventModel.create.mockResolvedValue(mockResult);

      await eventService.createEvent(eventDataWithDate);

      expect(eventModel.create).toHaveBeenCalledWith({
        ...eventDataWithDate,
        tag: 'org'
      });
    });

    test('should reject invalid date format', async () => {
      const eventDataWithInvalidDate = {
        ...baseEventData,
        date_time: 'invalid-date'
      };

      await expect(eventService.createEvent(eventDataWithInvalidDate))
        .rejects
        .toThrow('Invalid date format');
      
      expect(eventModel.create).not.toHaveBeenCalled();
    });
  });

  describe('Tag filtering methods', () => {
    test('getEventsByTag should call eventModel.getByTag', async () => {
      const mockEvents = [{ id: '1', tag: 'org' }];
      eventModel.getByTag.mockResolvedValue(mockEvents);

      const result = await eventService.getEventsByTag('org');

      expect(eventModel.getByTag).toHaveBeenCalledWith('org');
      expect(result).toEqual(mockEvents);
    });

    test('getEventsByGroupAndTag should call eventModel.getByGroupAndTag', async () => {
      const mockEvents = [{ id: '1', group_id: 'group-1', tag: 'org' }];
      eventModel.getByGroupAndTag.mockResolvedValue(mockEvents);

      const result = await eventService.getEventsByGroupAndTag('group-1', 'org');

      expect(eventModel.getByGroupAndTag).toHaveBeenCalledWith('group-1', 'org');
      expect(result).toEqual(mockEvents);
    });

    test('getEventsByRegionAndTag should call eventModel.getByRegionAndTag', async () => {
      const mockEvents = [{ id: '1', tag: 'org' }];
      eventModel.getByRegionAndTag.mockResolvedValue(mockEvents);

      const result = await eventService.getEventsByRegionAndTag('region-1', 'org');

      expect(eventModel.getByRegionAndTag).toHaveBeenCalledWith('region-1', 'org');
      expect(result).toEqual(mockEvents);
    });
  });
});
