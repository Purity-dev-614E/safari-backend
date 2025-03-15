const express = require('express');
const router = express.Router();
const { supabase } = require('../auth');
const knex = require('../db'); // Assuming you are using knex for database operations

// Sign Up
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error('Signup Error:', error);
    return res.status(400).json({ error: error.message });
  }

  // Debugging: Log the entire response from Supabase
  console.log('Supabase response:', { data, error });

  // Insert email and auth_id into the users table
  try {
    await knex('users').insert({
      auth_id: data.user.auth_id, // Supabase user ID
      email: data.user.email,
    });

    res.status(201).json({ user: data.user });
  } catch (dbError) {
    console.error('Database error:', dbError);
    return res.status(500).json({ error: 'Failed to insert user information into the database' });
  }
});

// Log In
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Login Error:', error);
    return res.status(400).json({ error: error.message });
  }

  console.log('Login data:', data);

  // Return session and user details
  res.status(200).json({ session: data.session, user: data.user });
});

module.exports = router;