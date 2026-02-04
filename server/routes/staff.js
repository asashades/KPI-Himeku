import express from 'express';
import bcrypt from 'bcryptjs';

export default function (db) {
  const router = express.Router();

  // Get all staff
  router.get('/', (req, res) => {
    try {
      const { department_id, active } = req.query;
      let query = `
        SELECT s.*, d.name as department_name, u.id as user_id, u.username
        FROM staff s 
        LEFT JOIN departments d ON s.department_id = d.id 
        LEFT JOIN users u ON s.email = u.email
        WHERE 1=1
      `;
      const params = [];

      if (department_id) {
        query += ' AND s.department_id = ?';
        params.push(department_id);
      }
      if (active !== undefined) {
        query += ' AND s.active = ?';
        params.push(active === 'true' ? 1 : 0);
      }

      query += ' ORDER BY s.name';

      const staff = db.prepare(query).all(...params);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get staff by ID
  router.get('/:id', (req, res) => {
    try {
      const staff = db.prepare(`
        SELECT s.*, d.name as department_name, u.id as user_id, u.username
        FROM staff s 
        LEFT JOIN departments d ON s.department_id = d.id 
        LEFT JOIN users u ON s.email = u.email
        WHERE s.id = ?
      `).get(req.params.id);
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create staff - also creates user account if email provided
  router.post('/', (req, res) => {
    try {
      const { name, email, photo_url, department_id, position, role, join_date, phone, bank_name, bank_account, city, active, password } = req.body;
      
      // Check if email already exists in staff
      if (email) {
        const existingStaff = db.prepare('SELECT id FROM staff WHERE email = ?').get(email);
        if (existingStaff) {
          return res.status(400).json({ error: 'Email sudah terdaftar di staff lain' });
        }
      }
      
      // Create staff record
      const result = db.prepare(`
        INSERT INTO staff (name, email, photo_url, department_id, position, role, join_date, phone, bank_name, bank_account, city, active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, 
        email || null, 
        photo_url || null, 
        department_id || null, 
        position || null, 
        role || 'Staff', 
        join_date || null, 
        phone || null, 
        bank_name || null, 
        bank_account || null, 
        city || null,
        active !== undefined ? (active ? 1 : 0) : 1
      );

      const staffId = result.lastInsertRowid;
      let userId = null;
      let username = null;

      // If email provided, also create user account for login
      if (email) {
        // Check if user with this email already exists
        const existingUser = db.prepare('SELECT id, username FROM users WHERE email = ?').get(email);
        
        if (existingUser) {
          // Link to existing user
          userId = existingUser.id;
          username = existingUser.username;
        } else {
          // Create new user account
          // Generate username from email (before @)
          const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let newUsername = baseUsername;
          let counter = 1;
          
          // Ensure unique username
          while (db.prepare('SELECT id FROM users WHERE username = ?').get(newUsername)) {
            newUsername = `${baseUsername}${counter}`;
            counter++;
          }
          
          // Default password is the username (user should change it)
          const defaultPassword = password || newUsername;
          const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
          
          const userResult = db.prepare(`
            INSERT INTO users (username, password, name, email, role, department_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(newUsername, hashedPassword, name, email, 'staff', department_id || null);
          
          userId = userResult.lastInsertRowid;
          username = newUsername;
        }
      }

      res.json({ 
        id: staffId, 
        name, 
        email,
        photo_url,
        department_id,
        position,
        role,
        active: active !== undefined ? active : true,
        user_id: userId,
        username: username,
        message: username ? `User account created with username: ${username}` : 'Staff created without login account'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update staff - also updates linked user account
  router.put('/:id', (req, res) => {
    try {
      const { name, email, photo_url, department_id, position, role, join_date, phone, bank_name, bank_account, city, active, password } = req.body;
      
      // Get current staff data
      const currentStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
      if (!currentStaff) {
        return res.status(404).json({ error: 'Staff not found' });
      }

      // Check if new email conflicts with other staff
      if (email && email !== currentStaff.email) {
        const existingStaff = db.prepare('SELECT id FROM staff WHERE email = ? AND id != ?').get(email, req.params.id);
        if (existingStaff) {
          return res.status(400).json({ error: 'Email sudah terdaftar di staff lain' });
        }
      }
      
      const updates = [];
      const params = [];

      if (name !== undefined) { updates.push('name = ?'); params.push(name); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email); }
      if (photo_url !== undefined) { updates.push('photo_url = ?'); params.push(photo_url); }
      if (department_id !== undefined) { updates.push('department_id = ?'); params.push(department_id); }
      if (position !== undefined) { updates.push('position = ?'); params.push(position); }
      if (role !== undefined) { updates.push('role = ?'); params.push(role); }
      if (join_date !== undefined) { updates.push('join_date = ?'); params.push(join_date); }
      if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
      if (bank_name !== undefined) { updates.push('bank_name = ?'); params.push(bank_name); }
      if (bank_account !== undefined) { updates.push('bank_account = ?'); params.push(bank_account); }
      if (city !== undefined) { updates.push('city = ?'); params.push(city); }
      if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }

      params.push(req.params.id);

      if (updates.length > 0) {
        db.prepare(`UPDATE staff SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      }

      // Handle user account sync
      let userMessage = '';
      
      if (currentStaff.email) {
        // Update existing linked user
        const linkedUser = db.prepare('SELECT id FROM users WHERE email = ?').get(currentStaff.email);
        if (linkedUser) {
          const userUpdates = [];
          const userParams = [];
          
          if (name !== undefined) { userUpdates.push('name = ?'); userParams.push(name); }
          if (email !== undefined && email !== currentStaff.email) { 
            userUpdates.push('email = ?'); 
            userParams.push(email); 
          }
          if (department_id !== undefined) { userUpdates.push('department_id = ?'); userParams.push(department_id); }
          if (password) {
            userUpdates.push('password = ?');
            userParams.push(bcrypt.hashSync(password, 10));
          }
          
          if (userUpdates.length > 0) {
            userParams.push(linkedUser.id);
            db.prepare(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`).run(...userParams);
            userMessage = 'User account also updated';
          }
        }
      } else if (email) {
        // New email added, create user account
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (!existingUser) {
          const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let newUsername = baseUsername;
          let counter = 1;
          while (db.prepare('SELECT id FROM users WHERE username = ?').get(newUsername)) {
            newUsername = `${baseUsername}${counter}`;
            counter++;
          }
          
          const defaultPassword = password || newUsername;
          const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
          
          db.prepare(`
            INSERT INTO users (username, password, name, email, role, department_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(newUsername, hashedPassword, name || currentStaff.name, email, 'staff', department_id || currentStaff.department_id);
          
          userMessage = `User account created with username: ${newUsername}`;
        }
      }

      res.json({ id: req.params.id, message: 'Staff updated', userMessage });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete staff - also deactivates linked user account
  router.delete('/:id', (req, res) => {
    try {
      const staff = db.prepare('SELECT email FROM staff WHERE id = ?').get(req.params.id);
      
      // Deactivate linked user instead of deleting
      if (staff?.email) {
        db.prepare('DELETE FROM users WHERE email = ?').run(staff.email);
      }
      
      db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
      res.json({ message: 'Staff and linked user account deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
