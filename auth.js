const { createClient } = require('@supabase/supabase-js');
const userModel = require('./models/userModel');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = data.user;
    
    // Get the full user details from the database
    const fullUser = await userModel.getByEmail(data.user.email);
    if (fullUser) {
      req.fullUser = fullUser;
      
      // Set region access flags based on user role
      if (fullUser.role === 'super admin') {
        req.bypassRegionCheck = true;
      } else {
        req.userRegionId = fullUser.region_id;
      }
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { supabase, authenticate };