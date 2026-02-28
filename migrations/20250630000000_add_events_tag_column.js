exports.up = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      table.text('tag').checkIn(['org', 'leadership']).defaultTo('org');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('events', function(table) {
      table.dropColumn('tag');
    });
};
