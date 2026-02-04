import express from 'express';

export default function (db) {
  const router = express.Router();

  // Google Spreadsheet ID for Rekap Live
  const SPREADSHEET_ID = '1FiTL5F7M5s6VFqDq4c4EghEembfV7oLMVmAXINAMEww';
  const SHEET_NAME = 'RekapLive';

  // Helper function to parse Google Sheets date format
  function parseGoogleDate(value) {
    if (!value) return '';
    
    // Check if it's a Google Date string like "Date(2026,0,29)"
    const dateMatch = String(value).match(/Date\((\d+),(\d+),(\d+)\)/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]); // 0-indexed
      const day = parseInt(dateMatch[3]);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    // Return as-is if already formatted
    return value;
  }

  // Helper function to parse Google Sheets time format
  function parseGoogleTime(value) {
    if (!value) return '';
    
    // Check if it's a Google Date/Time string like "Date(1899,11,30,13,0,0)"
    const timeMatch = String(value).match(/Date\(\d+,\d+,\d+,(\d+),(\d+),?(\d*)\)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]).toString().padStart(2, '0');
      const minutes = parseInt(timeMatch[2]).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // Return as-is if already formatted
    return value;
  }

  // Helper function to fetch from Google Sheets
  async function fetchGoogleSheet(spreadsheetId, sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed: ${response.status}`);
    }
    
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
          // Use formatted value (f) first if available, else use raw value (v)
          obj[header] = cell ? (cell.f || cell.v || '') : '';
        }
      });
      return obj;
    });
    
    return rows;
  }

  // Fetch Rekap Live from Google Sheets
  router.get('/rekap-live', async (req, res) => {
    try {
      const { startDate, endDate, email } = req.query;
      
      let rows;
      try {
        rows = await fetchGoogleSheet(SPREADSHEET_ID, SHEET_NAME);
      } catch (fetchError) {
        console.error('Google Sheets fetch error:', fetchError);
        return res.json([]); // Return empty array instead of crashing
      }

      // Get staff data for email validation
      let staffMap = {};
      try {
        const staffList = await db.all('SELECT name, email FROM staff WHERE active = 1');
        staffList.forEach(s => {
          if (s.email) staffMap[s.email.toLowerCase()] = s.name;
        });
      } catch (dbError) {
        console.error('Staff fetch error:', dbError);
      }

      // Map to standard format
      let rekapLive = rows.map(row => {
        const emailHost = row['EmailHost'] || '';
        // Try to get name from staff by email
        const staffName = emailHost ? staffMap[emailHost.toLowerCase()] : null;
        const displayName = staffName || row['NamaHost'] || 'Unknown';
        
        // Parse date and time values from Google Sheets format
        const tanggalLive = parseGoogleDate(row['TanggalLive']);
        const jamMulai = parseGoogleTime(row['JamMulai']);
        const jamSelesai = parseGoogleTime(row['JamSelesai']);
        
        return {
          RekapID: row['RekapID'] || '',
          EmailHost: emailHost,
          NamaHost: displayName,
          TanggalLive: tanggalLive,
          JamMulai: jamMulai,
          JamSelesai: jamSelesai,
          DurasiJam: parseFloat(row['DurasiJam']) || 0,
          Gaji: parseInt(String(row['Gaji']).replace(/[^\d]/g, '')) || 0,
          FotoBuktiURL: row['FotoBuktiURL'] || '',
          SubmitAt: row['SubmitAt'] || ''
        };
      }).filter(r => r.RekapID); // Filter out empty rows

      // Apply filters
      if (startDate && endDate) {
        rekapLive = rekapLive.filter(r => {
          const date = r.TanggalLive;
          return date >= startDate && date <= endDate;
        });
      }

      if (email) {
        rekapLive = rekapLive.filter(r => r.EmailHost.toLowerCase().includes(email.toLowerCase()));
      }

      // Sort by date descending
      rekapLive.sort((a, b) => new Date(b.TanggalLive) - new Date(a.TanggalLive));

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

      // Get staff data for email validation
      const staffList = await db.all('SELECT name, email FROM staff WHERE active = 1');
      const staffMap = {};
      staffList.forEach(s => {
        if (s.email) staffMap[s.email.toLowerCase()] = s.name;
      });

      // Group by host
      const summary = {};
      rekapLive.forEach(r => {
        const key = r.email_host || r.nama_host;
        // Try to get name from staff by email
        const staffName = r.email_host ? staffMap[r.email_host.toLowerCase()] : null;
        const displayName = staffName || r.nama_host || 'Unknown';
        
        if (!summary[key]) {
          summary[key] = {
            EmailHost: r.email_host,
            NamaHost: displayName,
            totalSessions: 0,
            totalHours: 0,
            totalGaji: 0
          };
        }
        summary[key].totalSessions++;
        summary[key].totalHours += r.durasi_jam;
        summary[key].totalGaji += r.gaji;
      });

      const result = Object.values(summary).sort((a, b) => b.totalHours - a.totalHours);
      res.json(result);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all hosts with their current month progress
  router.get('/hosts', async (req, res) => {
    try {
      // Get current month start and end dates
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      // Get last day of current month (works for all months including Feb)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthEnd = lastDay.toISOString().split('T')[0];
      
      const hosts = await db.all(`
        SELECT h.*, s.name, s.photo_url,
               COALESCE(SUM(ls.duration_hours), 0) as current_month_hours
        FROM hosts h
        JOIN staff s ON h.staff_id = s.id
        LEFT JOIN live_sessions ls ON h.id = ls.host_id 
          AND ls.date >= ? AND ls.date <= ?
        WHERE h.active = 1
        GROUP BY h.id, s.name, s.photo_url
        ORDER BY current_month_hours DESC
      `, [monthStart, monthEnd]);
      
      res.json(hosts);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get host by ID with full details
  router.get('/hosts/:id', async (req, res) => {
    try {
      const host = await db.get(`
        SELECT h.*, s.name, s.photo_url
        FROM hosts h
        JOIN staff s ON h.staff_id = s.id
        WHERE h.id = ?
      `, [req.params.id]);

      if (!host) {
        return res.status(404).json({ error: 'Host not found' });
      }

      // Get sessions for current month
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      // Get last day of current month (works for all months including Feb)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthEnd = lastDay.toISOString().split('T')[0];
      
      const sessions = await db.all(`
        SELECT * FROM live_sessions 
        WHERE host_id = ? AND date >= ? AND date <= ?
        ORDER BY date DESC, start_time DESC
      `, [req.params.id, monthStart, monthEnd]);

      res.json({ ...host, sessions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or update host
  router.post('/hosts', async (req, res) => {
    try {
      const { staff_id, monthly_target_hours } = req.body;
      
      // Check if host already exists for this staff
      const existing = await db.get('SELECT id FROM hosts WHERE staff_id = ?', [staff_id]);
      
      if (existing) {
        await db.run('UPDATE hosts SET monthly_target_hours = ? WHERE id = ?', [monthly_target_hours, existing.id]);
        res.json({ id: existing.id, staff_id, monthly_target_hours });
      } else {
        const result = await db.run('INSERT INTO hosts (staff_id, monthly_target_hours) VALUES (?, ?)', [staff_id, monthly_target_hours]);
        res.json({ id: result.lastInsertRowid, staff_id, monthly_target_hours });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add live session
  router.post('/sessions', async (req, res) => {
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

      const result = await db.run(`
        INSERT INTO live_sessions (host_id, date, start_time, end_time, duration_hours, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [host_id, date, start_time, end_time, duration, notes, req.user.id]);

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
  router.get('/sessions', async (req, res) => {
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

      const sessions = await db.all(query, params);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete session
  router.delete('/sessions/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM live_sessions WHERE id = ?', [req.params.id]);
      res.json({ message: 'Session deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update host target
  router.put('/hosts/:id', async (req, res) => {
    try {
      const { monthly_target_hours } = req.body;
      await db.run('UPDATE hosts SET monthly_target_hours = ? WHERE id = ?', [monthly_target_hours, req.params.id]);
      res.json({ message: 'Host updated successfully bestie! ✨' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete host
  router.delete('/hosts/:id', async (req, res) => {
    try {
      // Delete all sessions for this host first
      await db.run('DELETE FROM live_sessions WHERE host_id = ?', [req.params.id]);
      // Then delete the host
      await db.run('DELETE FROM hosts WHERE id = ?', [req.params.id]);
      res.json({ message: 'Host deleted successfully!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get imported data
  router.get('/imports', async (req, res) => {
    try {
      const imports = await db.all(`
        SELECT * FROM host_live_imports 
        ORDER BY tanggal_live DESC, created_at DESC
        LIMIT 500
      `);
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk import data from spreadsheet
  router.post('/imports', async (req, res) => {
    try {
      const { records } = req.body;
      
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'No records provided' });
      }

      let count = 0;
      for (const rec of records) {
        await db.run(`
          INSERT INTO host_live_imports 
          (rekap_id, email_host, nama_host, tanggal_live, jam_mulai, jam_selesai, durasi_jam, gaji, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          rec.rekap_id,
          rec.email_host,
          rec.nama_host,
          rec.tanggal_live,
          rec.jam_mulai,
          rec.jam_selesai,
          rec.durasi_jam || 0,
          rec.gaji || 0,
          req.user?.id || 1
        ]);
        count++;
      }

      res.json({ message: `${count} records imported successfully! 🚀`, count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete imported record
  router.delete('/imports/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM host_live_imports WHERE id = ?', [req.params.id]);
      res.json({ message: 'Import deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
