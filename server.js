// filepath: c:\Users\USER\Desktop\SAFARI BACKEND FINAL\server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');


// Import routes
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const eventRoutes = require('./routes/eventRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const regionRoutes = require('./routes/regionRoutes');

// Import role-specific analytics routes
const superAdminAnalyticsRoutes = require('./routes/superAdminAnalyticsRoutes');
const regionalManagerAnalyticsRoutes = require('./routes/regionalManagerAnalyticsRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');

// Create Express app
const app = express();


// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());


// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes); // Keep for backward compatibility
app.use('/api/regions', regionRoutes);

// Role-specific analytics routes
app.use('/api/super-admin/analytics', superAdminAnalyticsRoutes);
app.use('/api/regional-manager/analytics', regionalManagerAnalyticsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Church Management API for Church Connect' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;