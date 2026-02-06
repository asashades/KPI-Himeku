import express from 'express';

export default function (db) {
  const router = express.Router();

  // Google Spreadsheet settings for Host Live
  const SPREADSHEET_ID = '1FiTL5F7M5s6VFqDq4c4EghEembfV7oLMVmAXINAMEww';
  const SHEET_NAME = 'RekapLive';

  // Helper function to fetch Host Live data from Google Sheets
  async function fetchHostLiveReportFromSheets(startDate, endDate) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const text = await response.text();
      const jsonString = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonString);
      
      const cols = data.table.cols.map(col => col.label || '');
      const rows = data.table.rows.map(row => {
        const obj = {};
        row.c.forEach((cell, idx) => {
          const header = cols[idx];
          if (header) {
            obj[header] = cell ? (cell.f || cell.v || '') : '';
          }
        });
        return obj;
      });

      // Parse date from Google Sheets format
      const parseDate = (value) => {
        if (!value) return '';
        const dateMatch = String(value).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (dateMatch) {
          const year = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]); // 0-indexed
          const day = parseInt(dateMatch[3]);
          return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        return value;
      };

      // Group by host
      const hostMap = new Map();
      for (const row of rows) {
        if (!row['RekapID']) continue;
        
        const tanggal = parseDate(row['TanggalLive']);
        if (tanggal >= startDate && tanggal <= endDate) {
          const hostName = row['NamaHost'] || row['EmailHost'] || 'Unknown';
          const durasi = parseFloat(row['DurasiJam']) || 0;
          
          if (!hostMap.has(hostName)) {
            hostMap.set(hostName, {
              host_name: hostName,
              monthly_target_hours: 52, // Default target
              total_hours: 0,
              total_sessions: 0
            });
          }
          
          const host = hostMap.get(hostName);
          host.total_hours += durasi;
          host.total_sessions++;
        }
      }

      return Array.from(hostMap.values()).sort((a, b) => b.total_hours - a.total_hours);
    } catch (error) {
      console.error('Error fetching Host Live report from sheets:', error.message);
      return [];
    }
  }

  // Get comprehensive report
  router.get('/', async (req, res) => {
    try {
      const { department, start_date, end_date } = req.query;
      const reports = {};

      if (!start_date || !end_date) {
        return res.json({});
      }

      // Host Live Report - fetch from Google Sheets
      if (!department || department === '3') {
        try {
          reports.hostLive = await fetchHostLiveReportFromSheets(start_date, end_date);
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
        
        const hostReport = await fetchHostLiveReportFromSheets(start_date, end_date);

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
