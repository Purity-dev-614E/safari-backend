exports.up = function(knex) {
  return knex.schema
    .alterTable('users_groups', function(table) {
      table.boolean('is_active').defaultTo(true).after('role');
      table.index(['group_id', 'is_active'], 'idx_group_member_active');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('users_groups', function(table) {
      table.dropIndex(['group_id', 'is_active'], 'idx_group_member_active');
      table.dropColumn('is_active');
    });
};
