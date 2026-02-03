import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get all templates
  router.get('/', (req, res) => {
    try {
      const { department_id, type, active } = req.query;
      let query = 'SELECT ct.*, d.name as department_name FROM checklist_templates ct JOIN departments d ON ct.department_id = d.id WHERE 1=1';
      const params = [];

      if (department_id) {
        query += ' AND ct.department_id = ?';
        params.push(department_id);
      }
      if (type) {
        query += ' AND ct.type = ?';
        params.push(type);
      }
      if (active !== undefined) {
        query += ' AND ct.active = ?';
        params.push(active === 'true' ? 1 : 0);
      }

      query += ' ORDER BY ct.department_id, ct.name';

      const templates = db.prepare(query).all(...params);
      
      templates.forEach(template => {
        template.items = JSON.parse(template.items);
        template.tap_enabled = template.tap_enabled === 1;
      });

      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get template by ID
  router.get('/:id', (req, res) => {
    try {
      const template = db.prepare('SELECT * FROM checklist_templates WHERE id = ?').get(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      template.items = JSON.parse(template.items);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create template
  router.post('/', (req, res) => {
    try {
      const { department_id, name, type, items, tap_enabled } = req.body;
      
      const result = db.prepare(`
        INSERT INTO checklist_templates (department_id, name, type, items, tap_enabled)
        VALUES (?, ?, ?, ?, ?)
      `).run(department_id, name, type, JSON.stringify(items), tap_enabled !== false ? 1 : 0);

      res.json({ 
        id: result.lastInsertRowid, 
        department_id,
        name,
        type,
        items,
        active: 1
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update template
  router.put('/:id', (req, res) => {
    try {
      const { name, type, items, active, tap_enabled } = req.body;
      
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (type !== undefined) {
        updates.push('type = ?');
        params.push(type);
      }
      if (items !== undefined) {
        updates.push('items = ?');
        params.push(JSON.stringify(items));
      }
      if (active !== undefined) {
        updates.push('active = ?');
        params.push(active ? 1 : 0);
      }
      if (tap_enabled !== undefined) {
        updates.push('tap_enabled = ?');
        params.push(tap_enabled ? 1 : 0);
      }

      params.push(req.params.id);

      db.prepare(`UPDATE checklist_templates SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);

      res.json({ id: req.params.id, message: 'Template updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete template (soft delete)
  router.delete('/:id', (req, res) => {
    try {
      db.prepare('UPDATE checklist_templates SET active = 0 WHERE id = ?').run(req.params.id);
      res.json({ message: 'Template deactivated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
