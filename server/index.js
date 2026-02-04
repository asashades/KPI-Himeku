import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'himeku-secret-key-change-in-production';

// Database path - use /tmp for Railway (ephemeral but works for testing)
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.db' 
  : join(__dirname, '../database.db');

console.log('Database path:', dbPath);

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database schema
import('./db/schema.js').then(({ initializeDatabase }) => {
  initializeDatabase(db);
  console.log('Database initialized');
});

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
import('./routes/auth.js').then(({ default: authRoutes }) => {
  app.use('/api/auth', authRoutes(db, JWT_SECRET));
});

import('./routes/departments.js').then(({ default: departmentRoutes }) => {
  app.use('/api/departments', authenticate, departmentRoutes(db));
});

import('./routes/hostlive.js').then(({ default: hostliveRoutes }) => {
  app.use('/api/hostlive', authenticate, hostliveRoutes(db));
});

import('./routes/warehouse.js').then(({ default: warehouseRoutes }) => {
  app.use('/api/warehouse', authenticate, warehouseRoutes(db));
});

import('./routes/crewstore.js').then(({ default: crewstoreRoutes }) => {
  app.use('/api/crewstore', authenticate, crewstoreRoutes(db));
});

import('./routes/staff.js').then(({ default: staffRoutes }) => {
  app.use('/api/staff', authenticate, staffRoutes(db));
});

import('./routes/templates.js').then(({ default: templateRoutes }) => {
  app.use('/api/templates', authenticate, templateRoutes(db));
});

import('./routes/dashboard.js').then(({ default: dashboardRoutes }) => {
  app.use('/api/dashboard', authenticate, dashboardRoutes(db));
});

import('./routes/reports.js').then(({ default: reportRoutes }) => {
  app.use('/api/reports', authenticate, reportRoutes(db));
});

import('./routes/presensi.js').then(({ default: presensiRoutes }) => {
  app.use('/api/presensi', authenticate, presensiRoutes(db));
});

import('./routes/contentcreator.js').then(({ default: contentcreatorRoutes }) => {
  app.use('/api/contentcreator', authenticate, contentcreatorRoutes(db));
});

import('./routes/slipgaji.js').then(({ default: slipgajiRoutes }) => {
  app.use('/api/slipgaji', authenticate, slipgajiRoutes(db));
});

// Serve static files from public folder
app.use(express.static(join(__dirname, '../public')));

// Serve frontend build (for production)
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Application not built. Please run npm run build first.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
