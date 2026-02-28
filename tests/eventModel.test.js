const eventModel = require('../models/eventModel');
const db = require('../db');

// Mock the database
jest.mock('../db');

describe('Event Model - Tag Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByTag', () => {
    test('should query events by tag', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', tag: 'org' },
        { id: '2', title: 'Event 2', tag: 'org' }
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockEvents)
      };

      db.mockReturnValue(mockQueryBuilder);

      const result = await eventModel.getByTag('org');

      expect(db).toHaveBeenCalledWith('events');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ tag: 'org' });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getByGroupAndTag', () => {
    test('should query events by group_id and tag', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', group_id: 'group-1', tag: 'org' }
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockEvents)
      };

      db.mockReturnValue(mockQueryBuilder);

      const result = await eventModel.getByGroupAndTag('group-1', 'org');

      expect(db).toHaveBeenCalledWith('events');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ group_id: 'group-1', tag: 'org' });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getByRegionAndTag', () => {
    test('should query events by region and tag with join', async () => {
      const mockEvents = [
        { id: '1', title: 'Event 1', tag: 'org' }
      ];

      const mockQueryBuilder = {
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockEvents)
      };

      db.mockReturnValue(mockQueryBuilder);

      const result = await eventModel.getByRegionAndTag('region-1', 'org');

      expect(db).toHaveBeenCalledWith('events');
      expect(mockQueryBuilder.join).toHaveBeenCalledWith('groups', 'events.group_id', 'groups.id');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('groups.region_id', 'region-1');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('events.tag', 'org');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('events.*');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('create', () => {
    test('should create event with tag', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2026-02-28T10:00:00Z',
        group_id: 'group-1',
        tag: 'org'
      };

      const mockResult = [{ id: 'event-id', ...eventData }];

      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue(mockResult)
      };

      db.mockReturnValue(mockQueryBuilder);

      const result = await eventModel.create(eventData);

      expect(db).toHaveBeenCalledWith('events');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(eventData);
      expect(mockQueryBuilder.returning).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Integration test - Tag filtering workflow', () => {
    test('should support complete tag-based filtering workflow', async () => {
      // Test data
      const orgEvents = [
        { id: '1', title: 'Org Event 1', tag: 'org', group_id: 'group-1' },
        { id: '2', title: 'Org Event 2', tag: 'org', group_id: 'group-2' }
      ];

      const leadershipEvents = [
        { id: '3', title: 'Leadership Event 1', tag: 'leadership', group_id: 'group-1' }
      ];

      // Mock getByTag
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(orgEvents)
      };
      db.mockReturnValue(mockQueryBuilder);

      const orgResults = await eventModel.getByTag('org');
      expect(orgResults).toEqual(orgEvents);

      // Mock getByGroupAndTag
      mockQueryBuilder.select.mockResolvedValue([orgEvents[0]]);
      const groupOrgResults = await eventModel.getByGroupAndTag('group-1', 'org');
      expect(groupOrgResults).toEqual([orgEvents[0]]);

      // Mock getByRegionAndTag
      const mockQueryBuilder2 = {
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(leadershipEvents)
      };
      db.mockReturnValue(mockQueryBuilder2);
      const regionLeadershipResults = await eventModel.getByRegionAndTag('region-1', 'leadership');
      expect(regionLeadershipResults).toEqual(leadershipEvents);
    });
  });
});
