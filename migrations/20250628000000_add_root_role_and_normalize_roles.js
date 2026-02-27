exports.up = async function (knex) {
  // First, drop the existing role check constraint
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS role_check;
  `);

  // Update existing role values to normalized format (spaces)
  await knex.raw(`
    UPDATE users 
    SET role = CASE 
      WHEN role = 'super_admin' THEN 'super admin'
      WHEN role = 'regional_manager' THEN 'regional manager'
      ELSE role
    END
  `);

  // Add new CHECK constraint with all normalized roles including root (using spaces)
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT role_check
    CHECK (role IN ('root', 'super admin', 'regional manager', 'admin', 'user'));
  `);

  // Also update the users_groups table if it has role constraints (convert to spaces)
  await knex.raw(`
    UPDATE users_groups 
    SET role = CASE 
      WHEN role = 'super_admin' THEN 'super admin'
      WHEN role = 'regional_manager' THEN 'regional manager'
      ELSE role
    END
    WHERE role IN ('super_admin', 'regional_manager')
  `);
};

exports.down = async function (knex) {
  // Drop the new constraint
  await knex.raw(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS role_check;
  `);

  // Revert to old role values (convert spaces back to underscores)
  await knex.raw(`
    UPDATE users 
    SET role = CASE 
      WHEN role = 'super admin' THEN 'super_admin'
      WHEN role = 'regional manager' THEN 'regional_manager'
      ELSE role
    END
  `);

  // Add back the old constraint (with underscores)
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT role_check
    CHECK (role IN ('admin', 'user', 'super_admin', 'regional_manager'));
  `);

  // Revert users_groups table (convert spaces back to underscores)
  await knex.raw(`
    UPDATE users_groups 
    SET role = CASE 
      WHEN role = 'super admin' THEN 'super_admin'
      WHEN role = 'regional manager' THEN 'regional_manager'
      ELSE role
    END
    WHERE role IN ('super admin', 'regional manager')
  `);
};
