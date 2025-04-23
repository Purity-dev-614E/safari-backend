exports.up = async function (knex) {
  // First, create a temporary table to store existing region mappings
  await knex.schema.createTable('temp_region_mappings', function (table) {
    table.uuid('old_region_id').primary();
    table.string('new_region_name').notNullable();
  });

  // Get all existing regions
  const existingRegions = await knex('regions').select('*');

  // Map existing regions to the predefined list
  for (const region of existingRegions) {
    let newRegionName = 'KILIMANI'; // Default to KILIMANI if no match

    const regionNameUpper = region.name.toUpperCase();
    if (regionNameUpper.includes('KILIMANI')) newRegionName = 'KILIMANI';
    else if (regionNameUpper.includes('LANGATA')) newRegionName = 'LANGATA';
    else if (regionNameUpper.includes('EASTERN')) newRegionName = 'EASTERN';
    else if (regionNameUpper.includes('KIAMBU')) newRegionName = 'KIAMBU';
    else if (regionNameUpper.includes('WESTLANDS')) newRegionName = 'WESTLANDS';
    else if (regionNameUpper.includes('DIASPORA')) newRegionName = 'DIASPORA';
    else if (regionNameUpper.includes('INTERCOUNTY')) newRegionName = 'INTERCOUNTY';

    // Store the mapping
    await knex('temp_region_mappings').insert({
      old_region_id: region.id,
      new_region_name: newRegionName,
    });
  }

  // Drop foreign key constraints on users and groups
  await knex.schema.alterTable('users', function (table) {
    table.dropForeign('region_id');
  });

  await knex.schema.alterTable('groups', function (table) {
    table.dropForeign('region_id');
  });

  // Drop the existing regions table
  await knex.schema.dropTable('regions');

  // Create the new regions table with enum constraint
  await knex.schema.createTable('regions', function (table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable().unique();
    table.text('description');
    table.timestamps(true, true);
  });

  // Add check constraint to ensure only predefined regions are allowed
  await knex.raw(`
    ALTER TABLE regions
    ADD CONSTRAINT regions_name_check
    CHECK (name IN ('KILIMANI', 'LANGATA', 'EASTERN', 'KIAMBU', 'WESTLANDS', 'DIASPORA', 'INTERCOUNTY'));
  `);

  // Insert the predefined regions
  const predefinedRegions = [
    { name: 'KILIMANI', description: 'Kilimani Region' },
    { name: 'LANGATA', description: 'Langata Region' },
    { name: 'EASTERN', description: 'Eastern Region' },
    { name: 'KIAMBU', description: 'Kiambu Region' },
    { name: 'WESTLANDS', description: 'Westlands Region' },
    { name: 'DIASPORA', description: 'Diaspora Region' },
    { name: 'INTERCOUNTY', description: 'Intercounty Region' },
  ];

  const regionIdMap = {};

  for (const region of predefinedRegions) {
    const [newRegion] = await knex('regions').insert(region).returning('*');
    regionIdMap[newRegion.name] = newRegion.id;
  }

  // Update users table with new region IDs
  const userRegionMappings = await knex('users')
    .join('temp_region_mappings', 'users.region_id', 'temp_region_mappings.old_region_id')
    .select('users.id as user_id', 'temp_region_mappings.new_region_name');

  for (const mapping of userRegionMappings) {
    await knex('users')
      .where('id', mapping.user_id)
      .update({ region_id: regionIdMap[mapping.new_region_name] });
  }

  // Update groups table with new region IDs
  const groupRegionMappings = await knex('groups')
    .join('temp_region_mappings', 'groups.region_id', 'temp_region_mappings.old_region_id')
    .select('groups.id as group_id', 'temp_region_mappings.new_region_name');

  for (const mapping of groupRegionMappings) {
    await knex('groups')
      .where('id', mapping.group_id)
      .update({ region_id: regionIdMap[mapping.new_region_name] });
  }

  // Re-add foreign key constraints
  await knex.schema.alterTable('users', function (table) {
    table
      .uuid('region_id')
      .references('id')
      .inTable('regions')
      .onDelete('SET NULL')
      .alter();
  });

  await knex.schema.alterTable('groups', function (table) {
    table
      .uuid('region_id')
      .references('id')
      .inTable('regions')
      .onDelete('SET NULL')
      .alter();
  });

  // Drop the temporary mapping table
  await knex.schema.dropTable('temp_region_mappings');
};

exports.down = async function (knex) {
  // Remove the check constraint
  await knex.raw(`
    ALTER TABLE regions
    DROP CONSTRAINT regions_name_check;
  `);

  // Note: This down migration doesn't restore the original regions
  // as that information is lost. It only removes the constraint.
};