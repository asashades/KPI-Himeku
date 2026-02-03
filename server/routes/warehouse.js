import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get all warehouse checklists
  router.get('/checklists', (req, res) => {
    try {
      const { date, status } = req.query;
      let query = `
        SELECT wc.*, ct.name as template_name, u.name as completed_by_name
        FROM warehouse_checklists wc
        JOIN checklist_templates ct ON wc.template_id = ct.id
        LEFT JOIN users u ON wc.completed_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (date) {
        query += ' AND wc.date = ?';
        params.push(date);
      }
      if (status) {
        query += ' AND wc.status = ?';
        params.push(status);
      }

      query += ' ORDER BY wc.date DESC, wc.created_at DESC';

      const checklists = db.prepare(query).all(...params);
      
      // Parse items JSON
      checklists.forEach(checklist => {
        checklist.items = JSON.parse(checklist.items);
      });

      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new checklist
  router.post('/checklists', (req, res) => {
    try {
      const { date, template_id, items } = req.body;
      
      const result = db.prepare(`
        INSERT INTO warehouse_checklists (date, template_id, items)
        VALUES (?, ?, ?)
      `).run(date, template_id, JSON.stringify(items));

      res.json({ 
        id: result.lastInsertRowid, 
        date, 
        template_id, 
        items,
        status: 'pending'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update checklist
  router.put('/checklists/:id', (req, res) => {
    try {
      const { items, status, completed_by } = req.body;
      
      const updates = [];
      const params = [];

      if (items !== undefined) {
        updates.push('items = ?');
        params.push(JSON.stringify(items));
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      if (completed_by !== undefined) {
        updates.push('completed_by = ?');
        params.push(completed_by);
      }
      if (status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }

      params.push(req.params.id);

      db.prepare(`UPDATE warehouse_checklists SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);

      res.json({ id: req.params.id, message: 'Checklist updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete checklist
  router.delete('/checklists/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM warehouse_checklists WHERE id = ?').run(req.params.id);
      res.json({ message: 'Checklist deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get today's checklist status
  router.get('/today', (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const checklists = db.prepare(`
        SELECT wc.*, ct.name as template_name
        FROM warehouse_checklists wc
        JOIN checklist_templates ct ON wc.template_id = ct.id
        WHERE wc.date = ?
      `).all(today);

      checklists.forEach(checklist => {
        checklist.items = JSON.parse(checklist.items);
      });

      const completed = checklists.filter(c => c.status === 'completed').length;
      const total = checklists.length;

      res.json({ checklists, completed, total, date: today });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ DAILY REPORTS ============

  // Get all daily reports
  router.get('/daily-reports', (req, res) => {
    try {
      const { date } = req.query;
      let query = `
        SELECT dr.*, u.name as created_by_name
        FROM warehouse_daily_reports dr
        LEFT JOIN users u ON dr.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (date) {
        query += ' AND dr.date = ?';
        params.push(date);
      }

      query += ' ORDER BY dr.date DESC, dr.created_at DESC LIMIT 30';

      const reports = db.prepare(query).all(...params);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create daily report
  router.post('/daily-reports', (req, res) => {
    try {
      const { date, spx, jnt, total_kiriman, pending, restock } = req.body;
      
      const result = db.prepare(`
        INSERT INTO warehouse_daily_reports (date, spx, jnt, total_kiriman, pending, restock, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(date, spx || 0, jnt || 0, total_kiriman || 0, pending || '', restock || '', req.user.id);

      res.json({ 
        id: result.lastInsertRowid, 
        date, 
        spx, 
        jnt, 
        total_kiriman,
        pending,
        restock
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete daily report
  router.delete('/daily-reports/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM warehouse_daily_reports WHERE id = ?').run(req.params.id);
      res.json({ message: 'Report deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ WRONG ORDERS ============

  // Get all wrong orders
  router.get('/wrong-orders', (req, res) => {
    try {
      const { date, status, month } = req.query;
      let query = `
        SELECT wo.*, u.name as reported_by_name
        FROM warehouse_wrong_orders wo
        LEFT JOIN users u ON wo.reported_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (date) {
        query += ' AND wo.date = ?';
        params.push(date);
      }

      if (month) {
        query += ' AND strftime("%Y-%m", wo.date) = ?';
        params.push(month);
      }

      if (status) {
        query += ' AND wo.status = ?';
        params.push(status);
      }

      query += ' ORDER BY wo.date DESC, wo.created_at DESC LIMIT 100';

      const orders = db.prepare(query).all(...params);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create wrong order report
  router.post('/wrong-orders', (req, res) => {
    try {
      const { date, order_id, description, type, status } = req.body;
      
      const result = db.prepare(`
        INSERT INTO warehouse_wrong_orders (date, order_id, description, type, status, reported_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(date, order_id, description || '', type || 'wrong_item', status || 'pending', req.user.id);

      res.json({ 
        id: result.lastInsertRowid, 
        date, 
        order_id, 
        description,
        type,
        status
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update wrong order (e.g., mark as resolved)
  router.put('/wrong-orders/:id', (req, res) => {
    try {
      const { status, resolution_notes } = req.body;
      
      const updates = [];
      const params = [];

      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
        if (status === 'resolved') {
          updates.push('resolved_at = CURRENT_TIMESTAMP');
          updates.push('resolved_by = ?');
          params.push(req.user.id);
        }
      }
      if (resolution_notes !== undefined) {
        updates.push('resolution_notes = ?');
        params.push(resolution_notes);
      }

      params.push(req.params.id);

      db.prepare(`UPDATE warehouse_wrong_orders SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);

      res.json({ id: req.params.id, message: 'Wrong order updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete wrong order
  router.delete('/wrong-orders/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM warehouse_wrong_orders WHERE id = ?').run(req.params.id);
      res.json({ message: 'Wrong order deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get wrong order stats for dashboard
  router.get('/wrong-orders/stats', (req, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
        FROM warehouse_wrong_orders
        WHERE strftime('%Y-%m', date) = ?
      `).get(currentMonth);

      res.json({
        total: stats?.total || 0,
        pending: stats?.pending || 0,
        resolved: stats?.resolved || 0,
        month: currentMonth
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
