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
      id: data.user.id, // Supabase user ID
      auth_id:data.user.id,
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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error('Forgot Password Error:', error);
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ message: 'Password recovery email sent.' });
});

// Reset Password (called after user clicks the email link and submits a new password)
router.post('/reset-password', async (req, res) => {
  const { access_token, new_password } = req.body;

  if (!access_token || !new_password) {
    return res.status(400).json({ error: 'Access token and new password are required.' });
  }

  // Set the session using the recovery token from the email link
  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token: access_token, // recovery tokens act as both
  });

  if (sessionError) {
    console.error('Reset Password Session Error:', sessionError);
    return res.status(400).json({ error: sessionError.message });
  }

  const { error } = await supabase.auth.updateUser({ password: new_password });

  if (error) {
    console.error('Reset Password Error:', error);
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ message: 'Password has been reset successfully.' });
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error) {
    console.error('Refresh Token Error:', error);
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ session: data.session });
});

module.exports = router;