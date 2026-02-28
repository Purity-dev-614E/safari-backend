exports.up = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      // Add target_audience column for leadership events
      table.text('target_audience').checkIn(['all', 'rc_only', 'regional']).defaultTo('all');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      table.dropColumn('target_audience');
    });
};
