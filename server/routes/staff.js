import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get all staff
  router.get('/', (req, res) => {
    try {
      const { department_id, active } = req.query;
      let query = 'SELECT s.*, d.name as department_name FROM staff s LEFT JOIN departments d ON s.department_id = d.id WHERE 1=1';
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
      const staff = db.prepare('SELECT s.*, d.name as department_name FROM staff s LEFT JOIN departments d ON s.department_id = d.id WHERE s.id = ?').get(req.params.id);
      if (!staff) {
        return res.status(404).json({ error: 'Staff not found' });
      }
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create staff
  router.post('/', (req, res) => {
    try {
      const { name, email, photo_url, department_id, position, role, join_date, phone, bank_name, bank_account, city, active } = req.body;
      
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

      res.json({ 
        id: result.lastInsertRowid, 
        name, 
        email,
        photo_url,
        department_id,
        position,
        role,
        active: active !== undefined ? active : true
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update staff
  router.put('/:id', (req, res) => {
    try {
      const { name, email, photo_url, department_id, position, role, join_date, phone, bank_name, bank_account, city, active } = req.body;
      
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

      db.prepare(`UPDATE staff SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      res.json({ id: req.params.id, message: 'Staff updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete staff (hard delete)
  router.delete('/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
      res.json({ message: 'Staff deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
