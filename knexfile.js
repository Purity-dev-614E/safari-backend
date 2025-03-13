// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

require('dotenv').config();

module.exports = {

  development: {
    client: 'postgresql',
    connection: process.env.SUPABASE_HOST,  // Use the full connection string
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  },
  

  staging: {
    client: 'postgresql',
    connection: process.env.SUPABASE_HOST,  // Use the full connection string
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.SUPABASE_HOST,  // Use the full connection string
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  }

};

