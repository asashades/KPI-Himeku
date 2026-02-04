import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default function (db, JWT_SECRET) {
  const router = express.Router();

  // Seed database endpoint (one-time use)
  router.post('/seed', async (req, res) => {
    try {
      console.log('Starting database seeding...');
      
      // Check if already seeded
      const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
      if (adminExists) {
        return res.json({ message: 'Database already seeded', admin: true });
      }

      // Seed departments
      const deptCount = await db.get('SELECT COUNT(*) as count FROM departments');
      if (parseInt(deptCount.count) === 0) {
        await db.run(`INSERT INTO departments (name, color, icon) VALUES (?, ?, ?)`, ['Crew Store', 'green', 'Store']);
        await db.run(`INSERT INTO departments (name, color, icon) VALUES (?, ?, ?)`, ['Warehouse', 'blue', 'Package']);
        await db.run(`INSERT INTO departments (name, color, icon) VALUES (?, ?, ?)`, ['Host Live', 'red', 'Video']);
        await db.run(`INSERT INTO departments (name, color, icon) VALUES (?, ?, ?)`, ['Content Creator', 'pink', 'Instagram']);
        console.log('Departments seeded');
      }

      // Create admin user
      const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
      await db.run('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin', hashedAdminPassword, 'Administrator', 'admin']);
      console.log('Admin user created');

      // Employee data
      const employees = [
        { name: 'Ananda Raihan Faj', email: 'anandaraihanfaj@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-01-10', phone: '81234567890', bank_name: null, bank_account: null, city: 'Kota Surakarta', active: 1 },
        { name: 'Desas Noel Pitaloka', email: 'desasnoelp@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2023-06-01', phone: '81298765432', bank_name: 'BRI', bank_account: '310301035113532', city: 'Kota Surakarta', active: 0 },
        { name: 'Bernandetta Egidea T', email: 'deatannasa@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2023-06-01', phone: '81311223344', bank_name: 'MANDIRI', bank_account: '1380024006111', city: 'Kota Surakarta', active: 1 },
        { name: 'Eka Yunanda', email: 'yunaeka114@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-06-01', phone: null, bank_name: 'BRI', bank_account: '216701012306501', city: 'Kota Madiun', active: 1 },
        { name: 'Ghizca Alvinesha', email: 'ghizca2720@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2025-06-02', phone: null, bank_name: 'BCA', bank_account: '0790595009', city: 'Kota Surakarta', active: 1 },
        { name: 'Stefhanie Thirza Hapsari Setyaning Budi', email: 'stefhaniethirza@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-01-03', phone: null, bank_name: 'BCA', bank_account: '0154739412', city: 'Kab Karanganyar', active: 1 },
        { name: 'Shakila Dwi Yulianti', email: 'Shakiladwiy@gmail.com', department_id: 4, position: 'Creative', role: 'Staff', join_date: '2025-08-26', phone: null, bank_name: 'MANDIRI', bank_account: '1380022960079', city: 'Kota Surakarta', active: 1 },
        { name: 'Khamdan Muhammad Rifqi', email: 'khamdan1998@gmail.com', department_id: 2, position: 'Team Packing', role: 'Staff', join_date: '2023-06-01', phone: null, bank_name: 'BRI', bank_account: '673701013619530', city: 'Kota Surakarta', active: 1 },
        { name: 'Rosenna Olivia Paryudi', email: 'olivia.paryudi@gmail.com', department_id: 4, position: 'Content Creator', role: 'Staff', join_date: '2025-03-01', phone: null, bank_name: 'BCA', bank_account: '0374172545', city: 'Kota Surakarta', active: 1 },
        { name: 'Isti Nuriyah', email: 'istinuriyah14@gmail.com', department_id: 2, position: 'Manager', role: 'Staff', join_date: '2023-06-01', phone: null, bank_name: 'BRI', bank_account: '137901021776507', city: 'Kabupaten Wonosobo', active: 1 },
        { name: 'Annisa Devi Lianna', email: 'annisadeviliana@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2023-06-01', phone: null, bank_name: 'BRI', bank_account: '137901021722508', city: 'Kabupaten Wonosobo', active: 1 },
        { name: 'Laksmita Herdini Nuraini', email: 'lakshmi.lawliet22@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2024-10-01', phone: null, bank_name: 'Seabank', bank_account: '901754363496', city: 'Kota Surakarta', active: 1 },
        { name: 'Laila Maulidiah', email: 'maulidiahlaila7@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2024-10-01', phone: null, bank_name: 'BSI', bank_account: '7201493565', city: 'Kota Surakarta', active: 0 },
        { name: 'Deliana Fairuz Fahriyah', email: 'delianafairuz5@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2024-10-12', phone: null, bank_name: 'Blu BCA', bank_account: '003911415318', city: 'Kota Tegal', active: 0 },
        { name: 'Fadhila Putri', email: 'fdhlaaputri@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2025-06-02', phone: null, bank_name: 'BCA', bank_account: '77335554107', city: 'Kota Surakarta', active: 1 },
        { name: 'Puguh Priyo Cahyono', email: 'puguhpriyo707@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-03-01', phone: null, bank_name: 'MANDIRI', bank_account: '1380024260528', city: 'Kab Karanganyar', active: 1 },
        { name: 'Mustika Ayu Rahmadhani', email: 'mustikaayu374@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2024-01-11', phone: null, bank_name: 'GOPAY', bank_account: '085702328298', city: 'Kota Surakarta', active: 1 },
        { name: 'Larissa Doraltina', email: 'rezadethan2002@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-07-01', phone: null, bank_name: 'BCA', bank_account: '3940734257', city: 'Kabupaten Sumbawa', active: 1 },
        { name: 'Vania Christella', email: 'vaniachristella17@gmail.com', department_id: 4, position: 'Creative', role: 'Staff', join_date: '2025-08-26', phone: null, bank_name: null, bank_account: null, city: 'Kota Surakarta', active: 1 },
        { name: 'Fadhillah Fatimah Az-Zahro', email: 'dillaazzahro@students.uns.ac.id', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2026-01-13', phone: null, bank_name: 'BNI', bank_account: '830717024', city: 'Kota Surakarta', active: 1 },
        { name: 'Akbar Maulana Rifki', email: 'akbarmaulanarifki@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2026-01-13', phone: null, bank_name: 'Bank Jago', bank_account: '103993530192', city: 'Kota Surakarta', active: 1 }
      ];

      const createUsername = (name) => {
        const firstName = name.split(' ')[0];
        return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      };

      // Create users and staff
      for (const e of employees) {
        const username = createUsername(e.name);
        const password = username + '123';
        const hashed = bcrypt.hashSync(password, 10);
        
        // Insert user
        await db.run('INSERT INTO users (username, password, name, email, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
          [username, hashed, e.name, e.email, 'staff', e.department_id]);
        
        // Insert staff
        await db.run(`INSERT INTO staff (name, email, department_id, position, role, join_date, phone, bank_name, bank_account, city, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [e.name, e.email, e.department_id, e.position, e.role, e.join_date, e.phone, e.bank_name, e.bank_account, e.city, e.active]);
      }
      console.log('Employees seeded');

      // Seed checklist templates
      await db.run(`INSERT INTO checklist_templates (department_id, name, type, items) VALUES (?, ?, ?, ?)`,
        [2, 'Default Warehouse Checklist', 'daily', JSON.stringify([
          { id: 1, text: 'Cek stok barang', required: true },
          { id: 2, text: 'Verifikasi pesanan masuk', required: true },
          { id: 3, text: 'Packing barang ready', required: true },
          { id: 4, text: 'Update inventory', required: false }
        ])]);
      await db.run(`INSERT INTO checklist_templates (department_id, name, type, items) VALUES (?, ?, ?, ?)`,
        [1, 'Crewstore Opening', 'opening', JSON.stringify([
          { id: 1, text: 'Nyapu lantai', required: true },
          { id: 2, text: 'Ngepel', required: true },
          { id: 3, text: 'Lap kaca', required: true },
          { id: 4, text: 'Cek kasir', required: true }
        ])]);
      await db.run(`INSERT INTO checklist_templates (department_id, name, type, items) VALUES (?, ?, ?, ?)`,
        [1, 'Crewstore Closing', 'closing', JSON.stringify([
          { id: 1, text: 'Hitung kas', required: true },
          { id: 2, text: 'Bersihkan kasir', required: true },
          { id: 3, text: 'Rapikan display', required: true },
          { id: 4, text: 'Matikan lampu', required: true }
        ])]);
      console.log('Templates seeded');

      res.json({ message: 'Database seeded successfully!', employees: employees.length });
    } catch (error) {
      console.error('Seed error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      
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
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Register (admin only in production)
  router.post('/register', async (req, res) => {
    try {
      const { username, password, name, email, role, department_id } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      const result = await db.run(
        'INSERT INTO users (username, password, name, email, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, name, email || null, role || 'staff', department_id || null]
      );

      res.json({ id: result.lastInsertRowid, username, name, email, role, department_id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get current user
  router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await db.get('SELECT id, username, name, email, role, department_id FROM users WHERE id = ?', [decoded.id]);
      res.json(user);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Get all users (admin only)
  router.get('/users', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }
      const users = await db.all('SELECT id, username, name, email, role, department_id, created_at FROM users ORDER BY created_at DESC');
      res.json(users);
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // Update user (admin only)
  router.put('/users/:id', async (req, res) => {
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
      await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

      res.json({ message: 'User updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete user (admin only)
  router.delete('/users/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }

      await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
      res.json({ message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
