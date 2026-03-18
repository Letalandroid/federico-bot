const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Import routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const usersRoutes = require('./routes/users');
const categoriesRoutes = require('./routes/categories');
const teachersRoutes = require('./routes/teachers');
const classroomsRoutes = require('./routes/classrooms');
const movementsRoutes = require('./routes/movements');
const registryRoutes = require('./routes/registry');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/classrooms', classroomsRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/registry', registryRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
