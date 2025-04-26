exports.up = async function (knex) {
  // First, drop the existing CHECK constraint
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS role_check;
  `);

  // Add the new CHECK constraint with the correct role name
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT role_check
    CHECK (role IN ('admin', 'user', 'super admin', 'region_manager'));
  `);

  // Update any existing 'region manager' roles to 'region_manager'
  await knex.raw(`
    UPDATE users
    SET role = 'region_manager'
    WHERE role = 'region manager';
  `);
};

exports.down = async function (knex) {
  // Revert the CHECK constraint
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS role_check;
  `);

  // Add back the original CHECK constraint
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT role_check
    CHECK (role IN ('admin', 'user', 'super admin', 'region manager'));
  `);

  // Revert any 'region_manager' roles back to 'region manager'
  await knex.raw(`
    UPDATE users
    SET role = 'region manager'
    WHERE role = 'region_manager';
  `);
};