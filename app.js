const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const childRoutes = require('./routes/childRoutes');
app.use('/api/children', childRoutes);

const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/schedules', scheduleRoutes);

const logRoutes = require('./routes/logRoutes');
app.use('/api/logs', logRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const postRoutes = require('./routes/postRoutes');
app.use('/api/posts', postRoutes);

module.exports = app;
