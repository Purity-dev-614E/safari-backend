/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('group_removed_members', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('group_id').notNullable();
    table.uuid('user_id').notNullable();
    table.text('reason').notNullable();
    table.timestamp('removed_at').defaultTo(knex.fn.now());
    table.uuid('removed_by').notNullable();
    
    // Foreign key constraints
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('removed_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes for performance
    table.index(['group_id'], 'idx_removed_members_group');
    table.index(['user_id'], 'idx_removed_members_user');
    table.index(['removed_at'], 'idx_removed_members_date');
    table.index(['group_id', 'user_id'], 'idx_removed_members_group_user');
    
    // Ensure a user can only be removed once from a group
    table.unique(['group_id', 'user_id'], 'uq_removed_members_group_user');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('group_removed_members');
};
