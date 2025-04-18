exports.up = async function (knex) {
  await knex.schema
    // Create regions table
    .createTable('regions', function (table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name').notNullable().unique();
      table.text('description');
      table.timestamps(true, true);
    });

  await knex.schema.alterTable('users', function (table) {
    table.uuid('region_id').references('id').inTable('regions').onDelete('SET NULL');
    table.text('role').alter(); // Change the column type to text
  });

  // Add CHECK constraint for role column
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT role_check
    CHECK (role IN ('admin', 'user', 'super admin', 'region manager'));
  `);

  // Alter groups table
  await knex.schema.alterTable('groups', function (table) {
    table.uuid('region_id').references('id').inTable('regions').onDelete('SET NULL');
  });

  // Drop the unique constraint if it exists
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'groups_name_unique'
      ) THEN
        ALTER TABLE groups DROP CONSTRAINT groups_name_unique;
      END IF;
    END $$;
  `);

  // Add unique constraint for region_id and name combination
  await knex.schema.alterTable('groups', function (table) {
    table.unique(['region_id', 'name']);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('groups', function (table) {
    table.dropUnique(['region_id', 'name']); // Remove the unique constraint on region_id and name
    table.unique(['name'], 'groups_name_unique'); // Add back unique constraint on name if it existed before
    table.dropColumn('region_id'); // Drop the region_id column
  });

  // Remove CHECK constraint for role column
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT role_check;
  `);

  await knex.schema.alterTable('users', function (table) {
    table.enum('role', ['admin', 'user', 'super admin']).alter(); // Revert role enum to original values
    table.dropColumn('region_id'); // Drop the region_id column
  });

  await knex.schema.dropTableIfExists('regions'); // Drop regions table
};