require('dotenv').config(); // Load environment variables

const knexConfig = require('./knexfile.js')['development']; // Get development config
const knex = require('knex')(knexConfig); // Initialize knex instance

// Test database connection
knex.raw('SELECT 1')
  .then(() => console.log('✅ Database connected successfully!'))
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1); // Exit process if DB connection fails
  });

module.exports = knex; // Export the database instance
