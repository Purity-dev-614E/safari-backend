const { validate: uuidValidate } = require('uuid');

function normalizeAttendancePayload(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const normalized = { ...payload };

  if (normalized.eventId && !normalized.event_id) {
    normalized.event_id = normalized.eventId;
  }

  if (normalized.userId && !normalized.user_id) {
    normalized.user_id = normalized.userId;
  }

  if (normalized.groupId && !normalized.group_id) {
    normalized.group_id = normalized.groupId;
  }

  return normalized;
}

function validateAttendancePayload(payload = {}, options = {}) {
  const { partial = false } = options;

  if (!partial) {
    assertValue(payload.event_id, 'event_id is required');
    assertValue(payload.user_id, 'user_id is required');
  }

  if (payload.event_id && !uuidValidate(payload.event_id)) {
    throw badRequest('event_id must be a valid UUID');
  }

  if (payload.user_id && !uuidValidate(payload.user_id)) {
    throw badRequest('user_id must be a valid UUID');
  }
}

function assertValue(value, message) {
  if (value === undefined || value === null || value === '') {
    throw badRequest(message);
  }
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  normalizeAttendancePayload,
  validateAttendancePayload
};

