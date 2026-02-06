import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get all warehouse checklists
  router.get('/checklists', async (req, res) => {
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

      const checklists = await db.all(query, params);
      
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
  router.post('/checklists', async (req, res) => {
    try {
      const { date, template_id, items } = req.body;
      
      const result = await db.run(`
        INSERT INTO warehouse_checklists (date, template_id, items)
        VALUES (?, ?, ?)
      `, [date, template_id, JSON.stringify(items)]);

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
  router.put('/checklists/:id', async (req, res) => {
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

      await db.run(`UPDATE warehouse_checklists SET ${updates.join(', ')} WHERE id = ?`, params);

      res.json({ id: req.params.id, message: 'Checklist updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete checklist
  router.delete('/checklists/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM warehouse_checklists WHERE id = ?', [req.params.id]);
      res.json({ message: 'Checklist deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get today's checklist status
  router.get('/today', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const checklists = await db.all(`
        SELECT wc.*, ct.name as template_name
        FROM warehouse_checklists wc
        JOIN checklist_templates ct ON wc.template_id = ct.id
        WHERE wc.date = ?
      `, [today]);

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
  router.get('/daily-reports', async (req, res) => {
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

      const reports = await db.all(query, params);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create daily report
  router.post('/daily-reports', async (req, res) => {
    try {
      const { date, spx, jnt, total_kiriman, pending, restock } = req.body;
      
      const result = await db.run(`
        INSERT INTO warehouse_daily_reports (date, spx, jnt, total_kiriman, pending, restock, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [date, spx || 0, jnt || 0, total_kiriman || 0, pending || '', restock || '', req.user.id]);

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
  router.delete('/daily-reports/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM warehouse_daily_reports WHERE id = ?', [req.params.id]);
      res.json({ message: 'Report deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ WRONG ORDERS ============

  // Get all wrong orders
  router.get('/wrong-orders', async (req, res) => {
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
        // month format: YYYY-MM
        const [year, m] = month.split('-');
        const monthStart = `${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(m), 0);
        const monthEnd = lastDay.toISOString().split('T')[0];
        query += ' AND wo.date >= ? AND wo.date <= ?';
        params.push(monthStart, monthEnd);
      }

      if (status) {
        query += ' AND wo.status = ?';
        params.push(status);
      }

      query += ' ORDER BY wo.date DESC, wo.created_at DESC LIMIT 100';

      const orders = await db.all(query, params);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create wrong order report
  router.post('/wrong-orders', async (req, res) => {
    try {
      const { date, order_id, description, type, status } = req.body;
      
      const result = await db.run(`
        INSERT INTO warehouse_wrong_orders (date, order_id, description, type, status, reported_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [date, order_id, description || '', type || 'wrong_item', status || 'pending', req.user.id]);

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
  router.put('/wrong-orders/:id', async (req, res) => {
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

      await db.run(`UPDATE warehouse_wrong_orders SET ${updates.join(', ')} WHERE id = ?`, params);

      res.json({ id: req.params.id, message: 'Wrong order updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete wrong order
  router.delete('/wrong-orders/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM warehouse_wrong_orders WHERE id = ?', [req.params.id]);
      res.json({ message: 'Wrong order deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get wrong order stats for dashboard
  router.get('/wrong-orders/stats', async (req, res) => {
    try {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthEnd = lastDay.toISOString().split('T')[0];
      
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
        FROM warehouse_wrong_orders
        WHERE date >= ? AND date <= ?
      `, [monthStart, monthEnd]);

      res.json({
        total: stats?.total || 0,
        pending: stats?.pending || 0,
        resolved: stats?.resolved || 0,
        month: monthStart.slice(0, 7)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ PENDING ITEMS (To-Do List) ============

  // Get all active pending items
  router.get('/pending', async (req, res) => {
    try {
      const { source } = req.query;
      let query = 'SELECT * FROM pending_items WHERE completed = 0';
      const params = [];
      if (source) {
        query += ' AND source = ?';
        params.push(source);
      }
      query += ' ORDER BY created_at DESC';
      const items = await db.all(query, params);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add pending item
  router.post('/pending', async (req, res) => {
    try {
      const { text, source } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });
      const result = await db.run(
        'INSERT INTO pending_items (source, text, created_by) VALUES (?, ?, ?)',
        [source || 'warehouse', text.trim(), req.user.id]
      );
      res.json({ id: result.lastInsertRowid, source: source || 'warehouse', text: text.trim(), completed: 0 });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Complete (remove) pending item
  router.put('/pending/:id/complete', async (req, res) => {
    try {
      await db.run('UPDATE pending_items SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
      res.json({ message: 'Item completed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete pending item
  router.delete('/pending/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM pending_items WHERE id = ?', [req.params.id]);
      res.json({ message: 'Item deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ RESTOCK ITEMS (To-Do List) ============

  // Get all active restock items
  router.get('/restock', async (req, res) => {
    try {
      const { source } = req.query;
      let query = 'SELECT * FROM restock_items WHERE completed = 0';
      const params = [];
      if (source) {
        query += ' AND source = ?';
        params.push(source);
      }
      query += ' ORDER BY created_at DESC';
      const items = await db.all(query, params);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add restock item
  router.post('/restock', async (req, res) => {
    try {
      const { text, source } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });
      const result = await db.run(
        'INSERT INTO restock_items (source, text, created_by) VALUES (?, ?, ?)',
        [source || 'warehouse', text.trim(), req.user.id]
      );
      res.json({ id: result.lastInsertRowid, source: source || 'warehouse', text: text.trim(), completed: 0 });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Complete (remove) restock item
  router.put('/restock/:id/complete', async (req, res) => {
    try {
      await db.run('UPDATE restock_items SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
      res.json({ message: 'Item completed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete restock item
  router.delete('/restock/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM restock_items WHERE id = ?', [req.params.id]);
      res.json({ message: 'Item deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
