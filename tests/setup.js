// Test setup file
const { Pool } = require('pg');

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock database connection for testing
jest.mock('../db', () => {
  const mockDb = {
    __mockData: {},
    __reset: function() {
      this.__mockData = {};
    },
    __setMockData: function(table, data) {
      this.__mockData[table] = data;
    },
    __getMockData: function(table) {
      return this.__mockData[table] || [];
    }
  };

  // Create a mock query builder
  const createMockQueryBuilder = (table) => ({
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    returning: jest.fn().mockImplementation((fields) => {
      return Promise.resolve(mockDb.__getMockData(table));
    }),
    then: jest.fn().mockImplementation((callback) => {
      return Promise.resolve(mockDb.__getMockData(table)).then(callback);
    })
  });

  return jest.fn((table) => createMockQueryBuilder(table));
});

// Mock authentication middleware
jest.mock('../auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    // Mock authenticated user based on Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      if (authHeader.includes('user-token')) {
        req.fullUser = { id: 'user-id', role: 'user', region_id: 'region-1' };
      } else if (authHeader.includes('admin-token')) {
        req.fullUser = { id: 'admin-id', role: 'admin', region_id: 'region-1' };
      } else if (authHeader.includes('regional-manager-token')) {
        req.fullUser = { id: 'rm-id', role: 'regional manager', region_id: 'region-1' };
      } else if (authHeader.includes('root-token')) {
        req.fullUser = { id: 'root-id', role: 'root', region_id: null };
      }
    }
    next();
  })
}));

// Mock RBAC middleware
jest.mock('../middleware/rbacMiddleware', () => ({
  requireRole: jest.fn((role) => (req, res, next) => {
    if (!req.fullUser || req.fullUser.role !== role) {
      return res.status(403).json({ error: `Requires role: ${role}` });
    }
    next();
  }),
  checkRegionAccess: jest.fn((req, res, next) => {
    next();
  })
}));

// Global test utilities
global.testUtils = {
  createMockEvent: (overrides = {}) => ({
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test Description',
    date: '2026-02-28T10:00:00Z',
    location: 'Test Location',
    group_id: 'test-group-id',
    tag: 'org',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  createMockGroup: (overrides = {}) => ({
    id: 'test-group-id',
    name: 'Test Group',
    group_admin_id: 'admin-id',
    region_id: 'region-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  })
};

// Silence console.log during tests unless explicitly needed
if (!process.env.DEBUG_TESTS) {
  console.log = jest.fn();
  console.error = jest.fn();
}
