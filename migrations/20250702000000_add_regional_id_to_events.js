exports.up = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      // Add regional_id column for leadership events created by regional managers
      table.uuid('regional_id').references('id').inTable('regions').onDelete('SET NULL');
      
      // Add check constraint to ensure regional_id is only set for leadership events
      return knex.raw(`
        ALTER TABLE events 
        ADD CONSTRAINT check_leadership_event_regional 
        CHECK ((tag = 'leadership' AND regional_id IS NOT NULL) OR (tag != 'leadership' AND regional_id IS NULL))
      `);
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      // Drop the check constraint
      return knex.raw('ALTER TABLE events DROP CONSTRAINT IF EXISTS check_leadership_event_regional');
    })
    .then(() => {
      // Drop the regional_id column
      return knex.schema.alterTable('events', function(table) {
        table.dropColumn('regional_id');
      });
    });
};
