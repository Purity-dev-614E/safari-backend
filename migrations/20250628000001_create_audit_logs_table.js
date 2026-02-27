exports.up = function(knex) {
  return knex.schema
    .createTable('audit_logs', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('actor_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('target_id'); // For non-user targets like groups, regions
      table.string('action').notNullable(); // ROLE_CHANGE, USER_CREATION, etc.
      table.text('old_value'); // Previous value (role name, etc.)
      table.text('new_value'); // New value (role name, etc.)
      table.string('ip_address');
      table.text('user_agent');
      table.jsonb('metadata'); // Additional context
      table.timestamps(true, true);
      
      // Indexes for performance
      table.index(['actor_id']);
      table.index(['user_id']);
      table.index(['action']);
      table.index(['created_at']);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
