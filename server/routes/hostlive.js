import express from 'express';

export default function (db) {
  const router = express.Router();

  // Google Spreadsheet ID for Rekap Live
  const SPREADSHEET_ID = '1FiTL5F7M5s6VFqDq4c4EghEembfV7oLMVmAXINAMEww';
  const SHEET_NAME = 'RekapLive';

  // Fetch Rekap Live from Google Sheets
  router.get('/rekap-live', async (req, res) => {
    try {
      const { startDate, endDate, email } = req.query;
      
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // Parse Google Sheets JSON response
      const jsonString = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonString);
      
      // Extract headers and rows
      const cols = data.table.cols.map(col => col.label || '');
      const rows = data.table.rows.map(row => {
        const obj = {};
        row.c.forEach((cell, idx) => {
          const header = cols[idx];
          if (header) {
            obj[header] = cell ? (cell.v !== null && cell.v !== undefined ? cell.v : (cell.f || '')) : '';
          }
        });
        return obj;
      });

      // Map to standard format
      let rekapLive = rows.map(row => ({
        rekap_id: row['RekapID'] || '',
        email_host: row['EmailHost'] || '',
        nama_host: row['NamaHost'] || '',
        tanggal_live: row['TanggalLive'] || '',
        jam_mulai: row['JamMulai'] || '',
        jam_selesai: row['JamSelesai'] || '',
        durasi_jam: parseFloat(row['DurasiJam']) || 0,
        gaji: parseInt(row['Gaji']) || 0,
        foto_bukti_url: row['FotoBuktiURL'] || '',
        submit_at: row['SubmitAt'] || ''
      })).filter(r => r.rekap_id); // Filter out empty rows

      // Apply filters
      if (startDate && endDate) {
        rekapLive = rekapLive.filter(r => {
          const date = r.tanggal_live;
          return date >= startDate && date <= endDate;
        });
      }

      if (email) {
        rekapLive = rekapLive.filter(r => r.email_host.toLowerCase() === email.toLowerCase());
      }

      // Sort by date descending
      rekapLive.sort((a, b) => new Date(b.tanggal_live) - new Date(a.tanggal_live));

      res.json(rekapLive);
    } catch (error) {
      console.error('Error fetching rekap live:', error);
      res.status(500).json({ error: 'Failed to fetch rekap live from spreadsheet' });
    }
  });

  // Get rekap summary per host
  router.get('/rekap-summary', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      const jsonString = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonString);
      
      const cols = data.table.cols.map(col => col.label || '');
      const rows = data.table.rows.map(row => {
        const obj = {};
        row.c.forEach((cell, idx) => {
          const header = cols[idx];
          if (header) {
            obj[header] = cell ? (cell.v !== null && cell.v !== undefined ? cell.v : (cell.f || '')) : '';
          }
        });
        return obj;
      });

      let rekapLive = rows.map(row => ({
        email_host: row['EmailHost'] || '',
        nama_host: row['NamaHost'] || '',
        tanggal_live: row['TanggalLive'] || '',
        durasi_jam: parseFloat(row['DurasiJam']) || 0,
        gaji: parseInt(row['Gaji']) || 0
      })).filter(r => r.nama_host);

      // Apply date filter
      if (startDate && endDate) {
        rekapLive = rekapLive.filter(r => {
          const date = r.tanggal_live;
          return date >= startDate && date <= endDate;
        });
      }

      // Group by host
      const summary = {};
      rekapLive.forEach(r => {
        const key = r.email_host || r.nama_host;
        if (!summary[key]) {
          summary[key] = {
            email_host: r.email_host,
            nama_host: r.nama_host,
            total_sessions: 0,
            total_durasi: 0,
            total_gaji: 0
          };
        }
        summary[key].total_sessions++;
        summary[key].total_durasi += r.durasi_jam;
        summary[key].total_gaji += r.gaji;
      });

      const result = Object.values(summary).sort((a, b) => b.total_durasi - a.total_durasi);
      res.json(result);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all hosts with their current month progress
  router.get('/hosts', (req, res) => {
    try {
      const hosts = db.prepare(`
        SELECT h.*, s.name, s.photo_url,
               COALESCE(SUM(ls.duration_hours), 0) as current_month_hours
        FROM hosts h
        JOIN staff s ON h.staff_id = s.id
        LEFT JOIN live_sessions ls ON h.id = ls.host_id 
          AND strftime('%Y-%m', ls.date) = strftime('%Y-%m', 'now')
        WHERE h.active = 1
        GROUP BY h.id
        ORDER BY current_month_hours DESC
      `).all();
      
      res.json(hosts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get host by ID with full details
  router.get('/hosts/:id', (req, res) => {
    try {
      const host = db.prepare(`
        SELECT h.*, s.name, s.photo_url
        FROM hosts h
        JOIN staff s ON h.staff_id = s.id
        WHERE h.id = ?
      `).get(req.params.id);

      if (!host) {
        return res.status(404).json({ error: 'Host not found' });
      }

      // Get sessions for current month
      const sessions = db.prepare(`
        SELECT * FROM live_sessions 
        WHERE host_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        ORDER BY date DESC, start_time DESC
      `).all(req.params.id);

      res.json({ ...host, sessions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or update host
  router.post('/hosts', (req, res) => {
    try {
      const { staff_id, monthly_target_hours } = req.body;
      
      // Check if host already exists for this staff
      const existing = db.prepare('SELECT id FROM hosts WHERE staff_id = ?').get(staff_id);
      
      if (existing) {
        db.prepare('UPDATE hosts SET monthly_target_hours = ? WHERE id = ?')
          .run(monthly_target_hours, existing.id);
        res.json({ id: existing.id, staff_id, monthly_target_hours });
      } else {
        const result = db.prepare('INSERT INTO hosts (staff_id, monthly_target_hours) VALUES (?, ?)')
          .run(staff_id, monthly_target_hours);
        res.json({ id: result.lastInsertRowid, staff_id, monthly_target_hours });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add live session
  router.post('/sessions', (req, res) => {
    try {
      const { host_id, date, start_time, end_time, notes } = req.body;
      
      // Calculate duration in hours
      const start = new Date(`2000-01-01 ${start_time}`);
      const end = new Date(`2000-01-01 ${end_time}`);
      let duration = (end - start) / (1000 * 60 * 60);
      
      // Handle sessions that cross midnight
      if (duration < 0) {
        duration += 24;
      }

      const result = db.prepare(`
        INSERT INTO live_sessions (host_id, date, start_time, end_time, duration_hours, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(host_id, date, start_time, end_time, duration, notes, req.user.id);

      res.json({ 
        id: result.lastInsertRowid, 
        host_id, 
        date, 
        start_time, 
        end_time, 
        duration_hours: duration,
        notes 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get sessions by date range
  router.get('/sessions', (req, res) => {
    try {
      const { start_date, end_date, host_id } = req.query;
      let query = 'SELECT ls.*, h.staff_id, s.name as host_name FROM live_sessions ls JOIN hosts h ON ls.host_id = h.id JOIN staff s ON h.staff_id = s.id WHERE 1=1';
      const params = [];

      if (start_date) {
        query += ' AND ls.date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        query += ' AND ls.date <= ?';
        params.push(end_date);
      }
      if (host_id) {
        query += ' AND ls.host_id = ?';
        params.push(host_id);
      }

      query += ' ORDER BY ls.date DESC, ls.start_time DESC';

      const sessions = db.prepare(query).all(...params);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete session
  router.delete('/sessions/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM live_sessions WHERE id = ?').run(req.params.id);
      res.json({ message: 'Session deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update host target
  router.put('/hosts/:id', (req, res) => {
    try {
      const { monthly_target_hours } = req.body;
      db.prepare('UPDATE hosts SET monthly_target_hours = ? WHERE id = ?')
        .run(monthly_target_hours, req.params.id);
      res.json({ message: 'Host updated successfully bestie! ✨' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete host
  router.delete('/hosts/:id', (req, res) => {
    try {
      // Delete all sessions for this host first
      db.prepare('DELETE FROM live_sessions WHERE host_id = ?').run(req.params.id);
      // Then delete the host
      db.prepare('DELETE FROM hosts WHERE id = ?').run(req.params.id);
      res.json({ message: 'Host deleted successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get imported data
  router.get('/imports', (req, res) => {
    try {
      const imports = db.prepare(`
        SELECT * FROM host_live_imports 
        ORDER BY tanggal_live DESC, created_at DESC
        LIMIT 500
      `).all();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk import data from spreadsheet
  router.post('/imports', (req, res) => {
    try {
      const { records } = req.body;
      
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'No records provided' });
      }

      const stmt = db.prepare(`
        INSERT INTO host_live_imports 
        (rekap_id, email_host, nama_host, tanggal_live, jam_mulai, jam_selesai, durasi_jam, gaji, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((records) => {
        let count = 0;
        for (const rec of records) {
          stmt.run(
            rec.rekap_id,
            rec.email_host,
            rec.nama_host,
            rec.tanggal_live,
            rec.jam_mulai,
            rec.jam_selesai,
            rec.durasi_jam || 0,
            rec.gaji || 0,
            req.user?.id || 1
          );
          count++;
        }
        return count;
      });

      const count = insertMany(records);
      res.json({ message: `${count} records imported successfully! 🚀`, count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete imported record
  router.delete('/imports/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM host_live_imports WHERE id = ?').run(req.params.id);
      res.json({ message: 'Import deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
