import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'himeku-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();

    // Initialize schema
    const { initializeDatabase } = await import('./db/schema.js');
    await initializeDatabase(db);
    console.log('Database schema initialized');

    // Routes
    const { default: authRoutes } = await import('./routes/auth.js');
    app.use('/api/auth', authRoutes(db, JWT_SECRET));

    const { default: departmentRoutes } = await import('./routes/departments.js');
    app.use('/api/departments', authenticate, departmentRoutes(db));

    const { default: hostliveRoutes } = await import('./routes/hostlive.js');
    app.use('/api/hostlive', authenticate, hostliveRoutes(db));

    const { default: warehouseRoutes } = await import('./routes/warehouse.js');
    app.use('/api/warehouse', authenticate, warehouseRoutes(db));

    const { default: crewstoreRoutes } = await import('./routes/crewstore.js');
    app.use('/api/crewstore', authenticate, crewstoreRoutes(db));

    const { default: staffRoutes } = await import('./routes/staff.js');
    app.use('/api/staff', authenticate, staffRoutes(db));

    const { default: templateRoutes } = await import('./routes/templates.js');
    app.use('/api/templates', authenticate, templateRoutes(db));

    const { default: dashboardRoutes } = await import('./routes/dashboard.js');
    app.use('/api/dashboard', authenticate, dashboardRoutes(db));

    const { default: reportRoutes } = await import('./routes/reports.js');
    app.use('/api/reports', authenticate, reportRoutes(db));

    const { default: presensiRoutes } = await import('./routes/presensi.js');
    app.use('/api/presensi', authenticate, presensiRoutes(db));

    const { default: contentcreatorRoutes } = await import('./routes/contentcreator.js');
    app.use('/api/contentcreator', authenticate, contentcreatorRoutes(db));

    const { default: slipgajiRoutes } = await import('./routes/slipgaji.js');
    app.use('/api/slipgaji', authenticate, slipgajiRoutes(db));

    // Serve static files from public folder
    app.use(express.static(join(__dirname, '../public')));

    // Serve frontend build (for production)
    const distPath = join(__dirname, '../dist');
    app.use(express.static(distPath));

    // Handle SPA routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
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
      console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Supabase)' : 'SQLite (local)'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
