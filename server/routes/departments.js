import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get all departments
  router.get('/', async (req, res) => {
    try {
      const departments = await db.all('SELECT * FROM departments');
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all KPI settings
  router.get('/kpi-settings', async (req, res) => {
    try {
      const settings = await db.all('SELECT * FROM department_kpi_settings');
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get department by ID
  router.get('/:id', async (req, res) => {
    try {
      const department = await db.get('SELECT * FROM departments WHERE id = ?', [req.params.id]);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
      res.json(department);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update department
  router.put('/:id', async (req, res) => {
    try {
      const { name, color, icon } = req.body;
      await db.run('UPDATE departments SET name = ?, color = ?, icon = ? WHERE id = ?', [name, color, icon, req.params.id]);
      res.json({ id: req.params.id, name, color, icon });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update KPI settings for a department
  router.put('/:id/kpi-settings', async (req, res) => {
    try {
      const { kpi_config } = req.body;
      const kpiConfigJson = JSON.stringify(kpi_config);
      
      // Upsert KPI settings
      const existing = await db.get('SELECT id FROM department_kpi_settings WHERE department_id = ?', [req.params.id]);
      
      if (existing) {
        await db.run('UPDATE department_kpi_settings SET kpi_config = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE department_id = ?', [kpiConfigJson, req.user?.id || 1, req.params.id]);
      } else {
        await db.run('INSERT INTO department_kpi_settings (department_id, kpi_config, updated_by) VALUES (?, ?, ?)', [req.params.id, kpiConfigJson, req.user?.id || 1]);
      }
      
      res.json({ message: 'KPI settings updated successfully! 🎯', department_id: req.params.id, kpi_config });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
