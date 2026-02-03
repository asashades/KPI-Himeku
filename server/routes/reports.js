import express from 'express';

export default function (db) {
  const router = express.Router();

  // Get comprehensive report
  router.get('/', (req, res) => {
    try {
      const { department, start_date, end_date } = req.query;
      const reports = {};

      // Host Live Report
      if (!department || department === '1') {
        const hostReport = db.prepare(`
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
          GROUP BY h.id
          ORDER BY total_hours DESC
        `).all(start_date, end_date);

        reports.hostLive = hostReport;
      }

      // Warehouse Report
      if (!department || department === '2') {
        const warehouseReport = db.prepare(`
          SELECT 
            date,
            COUNT(*) as total_checklists,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            ROUND(AVG(CASE WHEN status = 'completed' THEN 100.0 ELSE 0 END), 2) as completion_rate
          FROM warehouse_checklists
          WHERE date >= ? AND date <= ?
          GROUP BY date
          ORDER BY date DESC
        `).all(start_date, end_date);

        reports.warehouse = warehouseReport;
      }

      // Crewstore Report
      if (!department || department === '3') {
        const crewstoreReport = db.prepare(`
          SELECT 
            date,
            CASE 
              WHEN opening_count > 0 AND closing_count > 0 THEN 'complete'
              WHEN opening_count > 0 OR closing_count > 0 THEN 'partial'
              ELSE 'none'
            END as status,
            opening_count,
            closing_count
          FROM (
            SELECT 
              dates.date,
              COUNT(DISTINCT co.id) as opening_count,
              COUNT(DISTINCT cc.id) as closing_count
            FROM (
              SELECT DISTINCT date FROM crewstore_opening WHERE date >= ? AND date <= ?
              UNION
              SELECT DISTINCT date FROM crewstore_closing WHERE date >= ? AND date <= ?
            ) dates
            LEFT JOIN crewstore_opening co ON dates.date = co.date
            LEFT JOIN crewstore_closing cc ON dates.date = cc.date
            GROUP BY dates.date
          )
          ORDER BY date DESC
        `).all(start_date, end_date, start_date, end_date);

        reports.crewstore = crewstoreReport;
      }

      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export report as text
  router.get('/export', (req, res) => {
    try {
      const { department, start_date, end_date } = req.query;
      let text = `LAPORAN KPI HIMEKU\n`;
      text += `Periode: ${start_date} s/d ${end_date}\n`;
      text += `${'='.repeat(50)}\n\n`;

      // Host Live
      if (!department || department === '1') {
        text += `📺 HOST LIVE\n`;
        text += `${'-'.repeat(50)}\n`;
        
        const hostReport = db.prepare(`
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
          GROUP BY h.id
          ORDER BY total_hours DESC
        `).all(start_date, end_date);

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
        
        const warehouseReport = db.prepare(`
          SELECT 
            date,
            COUNT(*) as total_checklists,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
          FROM warehouse_checklists
          WHERE date >= ? AND date <= ?
          GROUP BY date
          ORDER BY date DESC
        `).all(start_date, end_date);

        warehouseReport.forEach(day => {
          const rate = day.total_checklists > 0 
            ? ((day.completed / day.total_checklists) * 100).toFixed(1)
            : 0;
          text += `${day.date}: ${day.completed}/${day.total_checklists} checklist (${rate}%)\n`;
        });
        text += '\n';
      }

      // Crewstore
      if (!department || department === '3') {
        text += `🏪 CREWSTORE\n`;
        text += `${'-'.repeat(50)}\n`;
        
        const opening = db.prepare('SELECT COUNT(*) as count FROM crewstore_opening WHERE date >= ? AND date <= ?')
          .get(start_date, end_date);
        const closing = db.prepare('SELECT COUNT(*) as count FROM crewstore_closing WHERE date >= ? AND date <= ?')
          .get(start_date, end_date);

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
