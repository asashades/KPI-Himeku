import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get all departments
  router.get('/', (req, res) => {
    try {
      const departments = db.prepare('SELECT * FROM departments').all();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all KPI settings
  router.get('/kpi-settings', (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM department_kpi_settings').all();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get department by ID
  router.get('/:id', (req, res) => {
    try {
      const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
      res.json(department);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update department
  router.put('/:id', (req, res) => {
    try {
      const { name, color, icon } = req.body;
      db.prepare('UPDATE departments SET name = ?, color = ?, icon = ? WHERE id = ?')
        .run(name, color, icon, req.params.id);
      res.json({ id: req.params.id, name, color, icon });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update KPI settings for a department
  router.put('/:id/kpi-settings', (req, res) => {
    try {
      const { kpi_config } = req.body;
      const kpiConfigJson = JSON.stringify(kpi_config);
      
      // Upsert KPI settings
      const existing = db.prepare('SELECT id FROM department_kpi_settings WHERE department_id = ?').get(req.params.id);
      
      if (existing) {
        db.prepare('UPDATE department_kpi_settings SET kpi_config = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE department_id = ?')
          .run(kpiConfigJson, req.user?.id || 1, req.params.id);
      } else {
        db.prepare('INSERT INTO department_kpi_settings (department_id, kpi_config, updated_by) VALUES (?, ?, ?)')
          .run(req.params.id, kpiConfigJson, req.user?.id || 1);
      }
      
      res.json({ message: 'KPI settings updated successfully! 🎯', department_id: req.params.id, kpi_config });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
