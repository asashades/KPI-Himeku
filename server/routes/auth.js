import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default function (db, JWT_SECRET) {
  const router = express.Router();

  // Login
  router.post('/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email, department_id: user.department_id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          department_id: user.department_id
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register (admin only in production)
  router.post('/register', (req, res) => {
    try {
      const { username, password, name, email, role, department_id } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      const result = db.prepare(
        'INSERT INTO users (username, password, name, email, role, department_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(username, hashedPassword, name, email || null, role || 'staff', department_id || null);

      res.json({ id: result.lastInsertRowid, username, name, email, role, department_id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get current user
  router.get('/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, username, name, email, role, department_id FROM users WHERE id = ?').get(decoded.id);
      res.json(user);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Get all users (admin only)
  router.get('/users', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }
      const users = db.prepare('SELECT id, username, name, email, role, department_id, created_at FROM users ORDER BY created_at DESC').all();
      res.json(users);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Update user (admin only)
  router.put('/users/:id', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }

      const { username, name, email, role, department_id, password } = req.body;
      const updates = [];
      const params = [];

      if (username) { updates.push('username = ?'); params.push(username); }
      if (name) { updates.push('name = ?'); params.push(name); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email); }
      if (role) { updates.push('role = ?'); params.push(role); }
      if (department_id !== undefined) { updates.push('department_id = ?'); params.push(department_id); }
      if (password) { 
        updates.push('password = ?'); 
        params.push(bcrypt.hashSync(password, 10)); 
      }

      params.push(req.params.id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      res.json({ message: 'User updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete user (admin only)
  router.delete('/users/:id', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      res.json({ message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
