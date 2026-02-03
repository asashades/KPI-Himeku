import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get opening checklists
  router.get('/opening', (req, res) => {
    try {
      const { date } = req.query;
      let query = `
        SELECT co.*, u.name as completed_by_name
        FROM crewstore_opening co
        LEFT JOIN users u ON co.completed_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (date) {
        query += ' AND co.date = ?';
        params.push(date);
      }

      query += ' ORDER BY co.date DESC';

      const checklists = db.prepare(query).all(...params);
      
      checklists.forEach(checklist => {
        checklist.items = JSON.parse(checklist.items);
      });

      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create opening checklist
  router.post('/opening', (req, res) => {
    try {
      const { date, open_time, items, tap_status, tap_notes } = req.body;
      
      const result = db.prepare(`
        INSERT INTO crewstore_opening (date, open_time, items, tap_status, tap_notes, completed_by, status)
        VALUES (?, ?, ?, ?, ?, ?, 'completed')
      `).run(date, open_time, JSON.stringify(items), tap_status, tap_notes, req.user.id);

      res.json({ 
        id: result.lastInsertRowid, 
        date, 
        open_time,
        items,
        tap_status,
        tap_notes
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get closing checklists
  router.get('/closing', (req, res) => {
    try {
      const { date } = req.query;
      let query = `
        SELECT cc.*, u.name as completed_by_name
        FROM crewstore_closing cc
        LEFT JOIN users u ON cc.completed_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (date) {
        query += ' AND cc.date = ?';
        params.push(date);
      }

      query += ' ORDER BY cc.date DESC';

      const checklists = db.prepare(query).all(...params);
      
      checklists.forEach(checklist => {
        checklist.items = JSON.parse(checklist.items);
      });

      res.json(checklists);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create closing checklist
  router.post('/closing', (req, res) => {
    try {
      const { date, items, additional_notes, next_shift_morning, next_shift_afternoon, next_shift_stock, daily_sales } = req.body;
      
      const result = db.prepare(`
        INSERT INTO crewstore_closing 
        (date, items, additional_notes, next_shift_morning, next_shift_afternoon, next_shift_stock, daily_sales, completed_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
      `).run(date, JSON.stringify(items), additional_notes, next_shift_morning, next_shift_afternoon, next_shift_stock, daily_sales || 0, req.user.id);

      res.json({ 
        id: result.lastInsertRowid, 
        date,
        items,
        additional_notes,
        next_shift_morning,
        next_shift_afternoon,
        next_shift_stock,
        daily_sales
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get today's status
  router.get('/today', (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const opening = db.prepare('SELECT * FROM crewstore_opening WHERE date = ?').get(today);
      const closing = db.prepare('SELECT * FROM crewstore_closing WHERE date = ?').get(today);

      if (opening) opening.items = JSON.parse(opening.items);
      if (closing) closing.items = JSON.parse(closing.items);

      res.json({
        date: today,
        opening: opening || null,
        closing: closing || null,
        opening_completed: !!opening,
        closing_completed: !!closing
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update opening checklist
  router.put('/opening/:id', (req, res) => {
    try {
      const { open_time, items, tap_status, tap_notes, status } = req.body;
      
      const updates = [];
      const params = [];

      if (open_time !== undefined) {
        updates.push('open_time = ?');
        params.push(open_time);
      }
      if (items !== undefined) {
        updates.push('items = ?');
        params.push(JSON.stringify(items));
      }
      if (tap_status !== undefined) {
        updates.push('tap_status = ?');
        params.push(tap_status);
      }
      if (tap_notes !== undefined) {
        updates.push('tap_notes = ?');
        params.push(tap_notes);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      params.push(req.params.id);

      db.prepare(`UPDATE crewstore_opening SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);

      res.json({ id: req.params.id, message: 'Opening checklist updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update closing checklist
  router.put('/closing/:id', (req, res) => {
    try {
      const { items, additional_notes, next_shift_morning, next_shift_afternoon, next_shift_stock, daily_sales, status } = req.body;
      
      const updates = [];
      const params = [];

      if (items !== undefined) {
        updates.push('items = ?');
        params.push(JSON.stringify(items));
      }
      if (additional_notes !== undefined) {
        updates.push('additional_notes = ?');
        params.push(additional_notes);
      }
      if (next_shift_morning !== undefined) {
        updates.push('next_shift_morning = ?');
        params.push(next_shift_morning);
      }
      if (next_shift_afternoon !== undefined) {
        updates.push('next_shift_afternoon = ?');
        params.push(next_shift_afternoon);
      }
      if (next_shift_stock !== undefined) {
        updates.push('next_shift_stock = ?');
        params.push(next_shift_stock);
      }
      if (daily_sales !== undefined) {
        updates.push('daily_sales = ?');
        params.push(daily_sales);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      params.push(req.params.id);

      db.prepare(`UPDATE crewstore_closing SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);

      res.json({ id: req.params.id, message: 'Closing checklist updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
