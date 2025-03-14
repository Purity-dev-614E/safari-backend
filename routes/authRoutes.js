const express = require('express');
const router = express.Router();
const { supabase } = require('../auth');

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

  res.status(201).json({ user: data.user });
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
