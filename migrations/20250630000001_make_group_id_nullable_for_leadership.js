exports.up = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      // Make existing group_id column nullable
      table.uuid('group_id').alter();
      // Add check constraint for leadership events
      return knex.raw(`
        ALTER TABLE events 
        ADD CONSTRAINT check_leadership_event_group 
        CHECK ((tag = 'leadership' AND group_id IS NULL) OR (tag != 'leadership'))
      `);
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      // Drop the check constraint
      return knex.raw('ALTER TABLE events DROP CONSTRAINT IF EXISTS check_leadership_event_group');
      // Make group_id not nullable again
      table.uuid('group_id').notNullable();
    });
};
