import { Router } from 'express';

export default function presensiRoutes(db) {
  const router = Router();

  // Google Apps Script Web App URL for uploading photos to Google Drive
  // Deploy the script in /public/gas-presensi-upload.js to get this URL
  // Format: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
  const GAS_PRESENSI_URL = process.env.GAS_PRESENSI_URL || 'https://script.google.com/macros/s/AKfycbxZyxu6rk-m8DXMqKyz0jEivRpS6WZriVEDvXHa6FWEqsjdIfpk4mVy1MUluBjKOuOi/exec';

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
  router.get('/', async (req, res) => {
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

      const presensi = await db.all(query, params);
      res.json(presensi);
    } catch (error) {
      console.error('Error fetching presensi:', error);
      res.status(500).json({ error: 'Failed to fetch presensi' });
    }
  });

  // Get all presensi (admin only)
  router.get('/all', async (req, res) => {
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

      const presensi = await db.all(query, params);
      res.json(presensi);
    } catch (error) {
      console.error('Error fetching all presensi:', error);
      res.status(500).json({ error: 'Failed to fetch presensi' });
    }
  });

  // Get rekap keterlambatan (admin only)
  router.get('/rekap-terlambat', async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate dan endDate harus diisi' });
      }

      // Get all late check-ins within date range
      const lateRecords = await db.all(`
        SELECT p.*, u.name as staff_name, u.username, u.id as user_id
        FROM presensi p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE DATE(p.timestamp) BETWEEN ? AND ?
        AND p.jenis = 'Masuk'
        AND p.late_minutes > 0
        ORDER BY u.name, p.timestamp
      `, [startDate, endDate]);

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

  // Get rekap kehadiran per karyawan (admin only)
  router.get('/rekap-kehadiran', async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate dan endDate harus diisi' });
      }

      // Get all check-ins within date range grouped by user
      const allRecords = await db.all(`
        SELECT 
          u.id as user_id,
          u.name as staff_name,
          u.username,
          COUNT(DISTINCT CASE WHEN p.jenis = 'Masuk' THEN DATE(p.timestamp) END) as total_hadir,
          COUNT(CASE WHEN p.jenis = 'Masuk' AND (p.late_minutes IS NULL OR p.late_minutes = 0) THEN 1 END) as tepat_waktu,
          COUNT(CASE WHEN p.jenis = 'Masuk' AND p.late_minutes > 0 THEN 1 END) as terlambat,
          COALESCE(SUM(CASE WHEN p.jenis = 'Masuk' AND p.late_minutes > 0 THEN p.late_minutes ELSE 0 END), 0) as total_menit_terlambat
        FROM users u
        LEFT JOIN presensi p ON u.id = p.user_id AND DATE(p.timestamp) BETWEEN ? AND ?
        WHERE u.role != 'admin' OR p.id IS NOT NULL
        GROUP BY u.id, u.name, u.username
        HAVING COUNT(DISTINCT CASE WHEN p.jenis = 'Masuk' THEN DATE(p.timestamp) END) > 0
        ORDER BY u.name
      `, [startDate, endDate]);

      res.json(allRecords);
    } catch (error) {
      console.error('Error fetching rekap kehadiran:', error);
      res.status(500).json({ error: 'Failed to fetch rekap kehadiran' });
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
      if (!GAS_PRESENSI_URL) {
        // Return base64 directly if GAS not configured (fallback)
        return res.json({
          success: true,
          directUrl: base64,
          message: 'GAS_PRESENSI_URL belum dikonfigurasi, menggunakan base64'
        });
      }

      // Get staff name from user
      const user = await db.get('SELECT name FROM users WHERE id = ?', [req.user.id]);
      const staffName = user?.name || 'Unknown';
      const today = new Date().toISOString().split('T')[0];

      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

      // Call Google Apps Script Web App
      const response = await fetch(GAS_PRESENSI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'upload',
          base64Data: base64Data,
          fileName: `presensi_${staffName.replace(/\s+/g, '_')}_${Date.now()}.jpg`,
          mimeType: mimeType || 'image/jpeg',
          staffName: staffName,
          date: today
        })
      });

      const data = await response.json();

      if (data.success) {
        res.json({
          success: true,
          directUrl: data.data.directUrl,
          fileUrl: data.data.fileUrl,
          fileId: data.data.fileId,
          thumbnailUrl: data.data.thumbnailUrl
        });
      } else {
        // Fallback to base64 if upload fails
        console.error('GAS upload failed:', data.message);
        res.json({
          success: true,
          directUrl: base64,
          message: 'Upload ke Google Drive gagal, menggunakan base64'
        });
      }
    } catch (error) {
      console.error('Error uploading foto:', error);
      // Fallback to base64
      res.json({
        success: true,
        directUrl: req.body.base64,
        message: 'Error upload, menggunakan base64'
      });
    }
  });

  // Create new presensi
  router.post('/', async (req, res) => {
    try {
      const { jenis, shift, foto_url, latitude, longitude } = req.body;
      const timestamp = new Date().toISOString();

      if (!jenis || !shift) {
        return res.status(400).json({ error: 'Jenis dan shift harus diisi' });
      }

      // Check if already checked in/out today for this shift
      const today = timestamp.split('T')[0];
      const existingPresensi = await db.get(`
        SELECT * FROM presensi 
        WHERE user_id = ? AND DATE(timestamp) = ? AND jenis = ? AND shift = ?
      `, [req.user.id, today, jenis, shift]);

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

      const result = await db.run(`
        INSERT INTO presensi (user_id, timestamp, jenis, shift, foto_url, latitude, longitude, late_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [req.user.id, timestamp, jenis, shift, foto_url || null, latitude || null, longitude || null, lateMinutes]);

      const newPresensi = await db.get('SELECT * FROM presensi WHERE id = ?', [result.lastInsertRowid]);

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
  router.get('/stats', async (req, res) => {
    try {
      const { month, year } = req.query;
      const currentDate = new Date();
      const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
      const targetYear = parseInt(year) || currentDate.getFullYear();

      // Calculate date range for the month
      const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(targetYear, targetMonth, 0);
      const monthEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

      // Get total days worked this month
      const daysWorked = await db.get(`
        SELECT COUNT(DISTINCT DATE(timestamp)) as days
        FROM presensi
        WHERE user_id = ? 
        AND DATE(timestamp) >= ? 
        AND DATE(timestamp) <= ?
        AND jenis = 'Masuk'
      `, [req.user.id, monthStart, monthEnd]);

      // Get on-time count (late_minutes = 0 or NULL)
      const onTimeCount = await db.get(`
        SELECT COUNT(*) as count
        FROM presensi
        WHERE user_id = ? 
        AND DATE(timestamp) >= ? 
        AND DATE(timestamp) <= ?
        AND jenis = 'Masuk'
        AND (late_minutes IS NULL OR late_minutes = 0)
      `, [req.user.id, monthStart, monthEnd]);

      // Get late count
      const lateCount = await db.get(`
        SELECT COUNT(*) as count, COALESCE(SUM(late_minutes), 0) as total_minutes
        FROM presensi
        WHERE user_id = ? 
        AND DATE(timestamp) >= ? 
        AND DATE(timestamp) <= ?
        AND jenis = 'Masuk'
        AND late_minutes > 0
      `, [req.user.id, monthStart, monthEnd]);

      const totalMasuk = await db.get(`
        SELECT COUNT(*) as count
        FROM presensi
        WHERE user_id = ? 
        AND DATE(timestamp) >= ? 
        AND DATE(timestamp) <= ?
        AND jenis = 'Masuk'
      `, [req.user.id, monthStart, monthEnd]);

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
  router.delete('/:id', async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { id } = req.params;
      const result = await db.run('DELETE FROM presensi WHERE id = ?', [id]);

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
