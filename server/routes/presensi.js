import { Router } from 'express';

export default function presensiRoutes(db) {
  const router = Router();

  // Google Apps Script Web App URL for uploading photos to Google Drive
  // Deploy the script in /public/gas-upload-script.js to get this URL
  const GAS_UPLOAD_URL = process.env.GAS_UPLOAD_URL || '';

  // Shift time limits (max time to check in)
  const SHIFT_LIMITS = {
    'Pagi': { hour: 9, minute: 0 },           // 09:00
    'Siang': { hour: 13, minute: 0 },          // 13:00
    'Part Time Pagi': { hour: 9, minute: 0 },  // 09:00
    'Part Time Sore': { hour: 16, minute: 0 }  // 16:00
  };

  // Calculate late minutes based on shift
  const calculateLateMinutes = (timestamp, shift) => {
    const limit = SHIFT_LIMITS[shift];
    if (!limit) return 0;
    
    const checkInTime = new Date(timestamp);
    const limitTime = new Date(timestamp);
    limitTime.setHours(limit.hour, limit.minute, 0, 0);
    
    if (checkInTime > limitTime) {
      return Math.floor((checkInTime - limitTime) / (1000 * 60)); // minutes late
    }
    return 0;
  };

  // Get all presensi for current user
  router.get('/', (req, res) => {
    try {
      const { startDate, endDate, jenis } = req.query;
      let query = `
        SELECT p.*, u.name as staff_name, u.username
        FROM presensi p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
      `;
      const params = [req.user.id];

      if (startDate && endDate) {
        query += ' AND DATE(p.timestamp) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      if (jenis) {
        query += ' AND p.jenis = ?';
        params.push(jenis);
      }

      query += ' ORDER BY p.timestamp DESC';

      const presensi = db.prepare(query).all(...params);
      res.json(presensi);
    } catch (error) {
      console.error('Error fetching presensi:', error);
      res.status(500).json({ error: 'Failed to fetch presensi' });
    }
  });

  // Get all presensi (admin only)
  router.get('/all', (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { startDate, endDate, jenis, userId } = req.query;
      let query = `
        SELECT p.*, u.name as staff_name, u.username
        FROM presensi p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (userId) {
        query += ' AND p.user_id = ?';
        params.push(userId);
      }

      if (startDate && endDate) {
        query += ' AND DATE(p.timestamp) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      if (jenis) {
        query += ' AND p.jenis = ?';
        params.push(jenis);
      }

      query += ' ORDER BY p.timestamp DESC';

      const presensi = db.prepare(query).all(...params);
      res.json(presensi);
    } catch (error) {
      console.error('Error fetching all presensi:', error);
      res.status(500).json({ error: 'Failed to fetch presensi' });
    }
  });

  // Get rekap keterlambatan (admin only)
  router.get('/rekap-terlambat', (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate dan endDate harus diisi' });
      }

      // Get all late check-ins within date range
      const lateRecords = db.prepare(`
        SELECT p.*, u.name as staff_name, u.username, u.id as user_id
        FROM presensi p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE DATE(p.timestamp) BETWEEN ? AND ?
        AND p.jenis = 'Masuk'
        AND p.late_minutes > 0
        ORDER BY u.name, p.timestamp
      `).all(startDate, endDate);

      // Group by user and calculate totals
      const rekapByUser = {};
      lateRecords.forEach(record => {
        if (!rekapByUser[record.user_id]) {
          rekapByUser[record.user_id] = {
            user_id: record.user_id,
            staff_name: record.staff_name,
            username: record.username,
            late_count: 0,
            total_late_minutes: 0,
            late_details: []
          };
        }
        rekapByUser[record.user_id].late_count++;
        rekapByUser[record.user_id].total_late_minutes += record.late_minutes || 0;
        rekapByUser[record.user_id].late_details.push({
          date: record.timestamp.split('T')[0],
          shift: record.shift,
          late_minutes: record.late_minutes
        });
      });

      const rekap = Object.values(rekapByUser).sort((a, b) => b.total_late_minutes - a.total_late_minutes);
      
      res.json(rekap);
    } catch (error) {
      console.error('Error fetching rekap terlambat:', error);
      res.status(500).json({ error: 'Failed to fetch rekap' });
    }
  });

  // Upload foto ke Google Drive via Apps Script
  router.post('/upload-foto', async (req, res) => {
    try {
      const { base64, filename, mimeType } = req.body;

      if (!base64 || !filename) {
        return res.status(400).json({ error: 'base64 dan filename harus diisi' });
      }

      // Check if GAS URL is configured
      if (!GAS_UPLOAD_URL) {
        // Return base64 directly if GAS not configured (fallback)
        return res.json({
          success: true,
          directUrl: base64,
          message: 'GAS_UPLOAD_URL belum dikonfigurasi, menggunakan base64'
        });
      }

      // Call Google Apps Script Web App
      const response = await fetch(GAS_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64,
          filename: `${Date.now()}_${req.user.name.replace(/\s+/g, '_')}_${filename}`,
          mimeType: mimeType || 'image/jpeg'
        })
      });

      const data = await response.json();

      if (data.success) {
        res.json({
          success: true,
          directUrl: data.directUrl,
          fileUrl: data.fileUrl,
          fileId: data.fileId
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: data.error || 'Upload gagal' 
        });
      }
    } catch (error) {
      console.error('Error uploading foto:', error);
      res.status(500).json({ error: 'Gagal upload foto ke Google Drive' });
    }
  });

  // Create new presensi
  router.post('/', (req, res) => {
    try {
      const { jenis, shift, foto_url, latitude, longitude } = req.body;
      const timestamp = new Date().toISOString();

      if (!jenis || !shift) {
        return res.status(400).json({ error: 'Jenis dan shift harus diisi' });
      }

      // Check if already checked in/out today for this shift
      const today = timestamp.split('T')[0];
      const existingPresensi = db.prepare(`
        SELECT * FROM presensi 
        WHERE user_id = ? AND DATE(timestamp) = ? AND jenis = ? AND shift = ?
      `).get(req.user.id, today, jenis, shift);

      if (existingPresensi) {
        return res.status(400).json({ 
          error: `Anda sudah melakukan presensi ${jenis.toLowerCase()} untuk shift ${shift.toLowerCase()} hari ini` 
        });
      }

      // Calculate late minutes for check-in
      let lateMinutes = 0;
      if (jenis === 'Masuk') {
        lateMinutes = calculateLateMinutes(timestamp, shift);
      }

      const result = db.prepare(`
        INSERT INTO presensi (user_id, timestamp, jenis, shift, foto_url, latitude, longitude, late_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, timestamp, jenis, shift, foto_url || null, latitude || null, longitude || null, lateMinutes);

      const newPresensi = db.prepare('SELECT * FROM presensi WHERE id = ?').get(result.lastInsertRowid);

      let message = 'Presensi berhasil dicatat';
      if (lateMinutes > 0) {
        message += ` (Terlambat ${lateMinutes} menit)`;
      }

      res.status(201).json({
        message,
        presensi: newPresensi
      });
    } catch (error) {
      console.error('Error creating presensi:', error);
      res.status(500).json({ error: 'Failed to create presensi' });
    }
  });

  // Get presensi statistics
  router.get('/stats', (req, res) => {
    try {
      const { month, year } = req.query;
      const currentDate = new Date();
      const targetMonth = month || currentDate.getMonth() + 1;
      const targetYear = year || currentDate.getFullYear();

      // Get total days worked this month
      const daysWorked = db.prepare(`
        SELECT COUNT(DISTINCT DATE(timestamp)) as days
        FROM presensi
        WHERE user_id = ? 
        AND strftime('%m', timestamp) = ? 
        AND strftime('%Y', timestamp) = ?
        AND jenis = 'Masuk'
      `).get(req.user.id, String(targetMonth).padStart(2, '0'), String(targetYear));

      // Get on-time count (late_minutes = 0 or NULL)
      const onTimeCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM presensi
        WHERE user_id = ? 
        AND strftime('%m', timestamp) = ? 
        AND strftime('%Y', timestamp) = ?
        AND jenis = 'Masuk'
        AND (late_minutes IS NULL OR late_minutes = 0)
      `).get(req.user.id, String(targetMonth).padStart(2, '0'), String(targetYear));

      // Get late count
      const lateCount = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(late_minutes), 0) as total_minutes
        FROM presensi
        WHERE user_id = ? 
        AND strftime('%m', timestamp) = ? 
        AND strftime('%Y', timestamp) = ?
        AND jenis = 'Masuk'
        AND late_minutes > 0
      `).get(req.user.id, String(targetMonth).padStart(2, '0'), String(targetYear));

      const totalMasuk = db.prepare(`
        SELECT COUNT(*) as count
        FROM presensi
        WHERE user_id = ? 
        AND strftime('%m', timestamp) = ? 
        AND strftime('%Y', timestamp) = ?
        AND jenis = 'Masuk'
      `).get(req.user.id, String(targetMonth).padStart(2, '0'), String(targetYear));

      res.json({
        daysWorked: daysWorked?.days || 0,
        onTimeCount: onTimeCount?.count || 0,
        totalMasuk: totalMasuk?.count || 0,
        lateCount: lateCount?.count || 0,
        totalLateMinutes: lateCount?.total_minutes || 0,
        month: targetMonth,
        year: targetYear
      });
    } catch (error) {
      console.error('Error fetching presensi stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Delete presensi (admin only)
  router.delete('/:id', (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { id } = req.params;
      const result = db.prepare('DELETE FROM presensi WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Presensi not found' });
      }

      res.json({ message: 'Presensi deleted successfully' });
    } catch (error) {
      console.error('Error deleting presensi:', error);
      res.status(500).json({ error: 'Failed to delete presensi' });
    }
  });

  return router;
}
