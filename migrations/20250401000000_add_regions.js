exports.up = function(knex) {
  return knex.schema
    // Create regions table
    .createTable('regions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable().unique();
      table.text('description');
      table.timestamps(true, true);
    })
    
    // Add region_id to users table
    .alterTable('users', function(table) {
      table.uuid('region_id').references('id').inTable('regions').onDelete('SET NULL');
      // Update role enum to include REGION_MANAGER
      table.enum('role', ['admin', 'user', 'super admin', 'region manager']).alter();
    })
    
    // Add region_id to groups table and create unique constraint
    .alterTable('groups', function(table) {
      table.uuid('region_id').references('id').inTable('regions').onDelete('SET NULL');
      // Drop existing index if any on name column
      table.dropUnique(['name'], 'groups_name_unique');
      // Add unique constraint for region_id and name combination
      table.unique(['region_id', 'name']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('groups', function(table) {
      // Remove the unique constraint on region_id and name
      table.dropUnique(['region_id', 'name']);
      // Add back unique constraint on name if it existed before
      table.unique(['name'], 'groups_name_unique');
      // Drop the region_id column
      table.dropColumn('region_id');
    })
    .alterTable('users', function(table) {
      // Revert role enum to original values
      table.enum('role', ['admin', 'user', 'super admin']).alter();
      // Drop the region_id column
      table.dropColumn('region_id');
    })
    .dropTableIfExists('regions');
};