exports.up = async function (knex) {
    // Drop existing CHECK constraint
    await knex.raw(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'role_check'
        ) THEN
          ALTER TABLE users DROP CONSTRAINT role_check;
        END IF;
      END
      $$;
    `);
  
    // (Optional) Convert ENUM to TEXT if needed
    await knex.raw(`ALTER TABLE users ALTER COLUMN role TYPE TEXT`);
  
    // Add new CHECK constraint
    await knex.raw(`
      ALTER TABLE users
      ADD CONSTRAINT role_check
      CHECK (role IN ('admin', 'user', 'super admin', 'region manager'));
    `);
  };
  
  exports.down = async function (knex) {
    // Rollback logic — restore the old constraint
    await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS role_check`);
  
    await knex.raw(`
      ALTER TABLE users
      ADD CONSTRAINT role_check
      CHECK (role IN ('admin', 'user', 'super admin'));
    `);
  };
  
