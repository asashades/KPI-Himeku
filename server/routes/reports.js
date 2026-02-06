import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get comprehensive report
  router.get('/', async (req, res) => {
    try {
      const { department, start_date, end_date } = req.query;
      const reports = {};

      if (!start_date || !end_date) {
        return res.json({});
      }

      // Host Live Report
      if (!department || department === '3') {
        try {
          const hostReport = await db.all(`
            SELECT 
              s.name as host_name,
              h.monthly_target_hours,
              COALESCE(SUM(ls.duration_hours), 0) as total_hours,
              COUNT(ls.id) as total_sessions
            FROM hosts h
            JOIN staff s ON h.staff_id = s.id
            LEFT JOIN live_sessions ls ON h.id = ls.host_id
              AND ls.date >= ? AND ls.date <= ?
            WHERE h.active = 1
            GROUP BY h.id, s.name, h.monthly_target_hours
            ORDER BY total_hours DESC
          `, [start_date, end_date]);
          reports.hostLive = hostReport || [];
        } catch (e) {
          console.error('Reports hostLive error:', e.message);
          reports.hostLive = [];
        }
      }

      // Warehouse Report
      if (!department || department === '2') {
        try {
          const warehouseReport = await db.all(`
            SELECT 
              date,
              COUNT(*) as total_checklists,
              COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
              ROUND(AVG(CASE WHEN status = 'completed' THEN 100.0 ELSE 0 END), 2) as completion_rate
            FROM warehouse_checklists
            WHERE date >= ? AND date <= ?
            GROUP BY date
            ORDER BY date DESC
          `, [start_date, end_date]);
          reports.warehouse = warehouseReport || [];
        } catch (e) {
          console.error('Reports warehouse error:', e.message);
          reports.warehouse = [];
        }
      }

      // Crewstore Report
      if (!department || department === '1') {
        try {
          // Simplified: get opening and closing dates separately
          const openings = await db.all(`
            SELECT date, COUNT(*) as cnt FROM crewstore_opening
            WHERE date >= ? AND date <= ?
            GROUP BY date
          `, [start_date, end_date]);
          const closings = await db.all(`
            SELECT date, COUNT(*) as cnt FROM crewstore_closing
            WHERE date >= ? AND date <= ?
            GROUP BY date
          `, [start_date, end_date]);

          // Merge in JS for PostgreSQL compatibility
          const dateMap = new Map();
          for (const o of (openings || [])) {
            dateMap.set(o.date, { date: o.date, opening_count: parseInt(o.cnt) || 0, closing_count: 0 });
          }
          for (const c of (closings || [])) {
            if (dateMap.has(c.date)) {
              dateMap.get(c.date).closing_count = parseInt(c.cnt) || 0;
            } else {
              dateMap.set(c.date, { date: c.date, opening_count: 0, closing_count: parseInt(c.cnt) || 0 });
            }
          }
          reports.crewstore = Array.from(dateMap.values())
            .map(d => ({
              ...d,
              status: d.opening_count > 0 && d.closing_count > 0 ? 'complete'
                : d.opening_count > 0 || d.closing_count > 0 ? 'partial' : 'none'
            }))
            .sort((a, b) => b.date.localeCompare(a.date));
        } catch (e) {
          console.error('Reports crewstore error:', e.message);
          reports.crewstore = [];
        }
      }

      res.json(reports);
    } catch (error) {
      console.error('Reports error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Export report as text
  router.get('/export', async (req, res) => {
    try {
      const { department, start_date, end_date } = req.query;
      let text = `LAPORAN KPI HIMEKU\n`;
      text += `Periode: ${start_date} s/d ${end_date}\n`;
      text += `${'='.repeat(50)}\n\n`;

      // Host Live
      if (!department || department === '3') {
        text += `📺 HOST LIVE\n`;
        text += `${'-'.repeat(50)}\n`;
        
        const hostReport = await db.all(`
          SELECT 
            s.name as host_name,
            h.monthly_target_hours,
            COALESCE(SUM(ls.duration_hours), 0) as total_hours,
            COUNT(ls.id) as total_sessions
          FROM hosts h
          JOIN staff s ON h.staff_id = s.id
          LEFT JOIN live_sessions ls ON h.id = ls.host_id
            AND ls.date >= ? AND ls.date <= ?
          WHERE h.active = 1
          GROUP BY h.id, s.name, h.monthly_target_hours
          ORDER BY total_hours DESC
        `, [start_date, end_date]);

        hostReport.forEach(host => {
          const progress = host.monthly_target_hours > 0 
            ? ((host.total_hours / host.monthly_target_hours) * 100).toFixed(1)
            : 0;
          text += `${host.host_name}: ${host.total_hours.toFixed(1)}/${host.monthly_target_hours} jam (${progress}%) - ${host.total_sessions} sesi\n`;
        });
        text += '\n';
      }

      // Warehouse
      if (!department || department === '2') {
        text += `📦 WAREHOUSE\n`;
        text += `${'-'.repeat(50)}\n`;
        
        const warehouseReport = await db.all(`
          SELECT 
            date,
            COUNT(*) as total_checklists,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
          FROM warehouse_checklists
          WHERE date >= ? AND date <= ?
          GROUP BY date
          ORDER BY date DESC
        `, [start_date, end_date]);

        warehouseReport.forEach(day => {
          const rate = day.total_checklists > 0 
            ? ((day.completed / day.total_checklists) * 100).toFixed(1)
            : 0;
          text += `${day.date}: ${day.completed}/${day.total_checklists} checklist (${rate}%)\n`;
        });
        text += '\n';
      }

      // Crewstore
      if (!department || department === '1') {
        text += `🏪 CREWSTORE\n`;
        text += `${'-'.repeat(50)}\n`;
        
        const opening = await db.get('SELECT COUNT(*) as count FROM crewstore_opening WHERE date >= ? AND date <= ?', [start_date, end_date]);
        const closing = await db.get('SELECT COUNT(*) as count FROM crewstore_closing WHERE date >= ? AND date <= ?', [start_date, end_date]);

        text += `Opening: ${opening.count} hari\n`;
        text += `Closing: ${closing.count} hari\n`;
        text += '\n';
      }

      res.type('text/plain');
      res.send(text);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
