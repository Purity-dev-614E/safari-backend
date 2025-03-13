const express = require('express');
const router = express.Router();
const { supabase } = require('../auth');
const knex = require('../db'); // Assuming you are using knex for database operations

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // Debugging: Log the entire response from Supabase
  console.log('Supabase response:', { data, error });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Debugging: Log the data object
  console.log('Supabase data:', data);

  // Insert email and auth_id into the users table
  try {
    await knex('users').insert({
      auth_id: data.user.id, // Supabase user ID
      email: data.user.email,
    });

    res.status(201).json({ user: data.user });
  } catch (dbError) {
    console.error('Database error:', dbError);
    return res.status(500).json({ error: 'Failed to insert user information into the database' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ session });
});

module.exports = router;