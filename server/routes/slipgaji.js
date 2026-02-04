import express from 'express';

export default function (db) {
  const router = express.Router();

  const SPREADSHEET_ID = '1pApwGf1xzE-y9Om8ztfeW91V7tuiYprZvgvjItIQdGg';
  const SHEET_NAME = 'Rekap_Gaji';

  // Helper function to fetch from Google Sheets
  async function fetchGoogleSheet(spreadsheetId, sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Parse Google Sheets JSON response (remove prefix/suffix)
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
    
    return rows;
  }

  // Fetch slip gaji from Google Sheets
  router.get('/', async (req, res) => {
    try {
      const { email } = req.query;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

      let rows;
      try {
        rows = await fetchGoogleSheet(SPREADSHEET_ID, SHEET_NAME);
      } catch (fetchError) {
        console.error('Google Sheets fetch error:', fetchError);
        return res.json([]); // Return empty array instead of crashing
      }

      // Map to standard format
      let slipGaji = rows.map(row => ({
        no_slip: row['No Slip'] || '',
        tanggal: row['Tanggal'] || '',
        bulan: row['Bulan'] || '',
        tahun: row['Tahun'] || '',
        nama: row['Nama Lengkap'] || '',
        email: row['Email'] || '',
        departemen: row['Departemen'] || '',
        gaji_pokok: parseFloat(row['Gaji Pokok']) || 0,
        detail_tunjangan: row['Detail Tunjangan (JSON)'] || '[]',
        total_tunjangan: parseFloat(row['Total Tunjangan']) || 0,
        detail_bonus: row['Detail Bonus (JSON)'] || '[]',
        total_bonus: parseFloat(row['Total Bonus']) || 0,
        detail_potongan: row['Detail Potongan (JSON)'] || '[]',
        total_potongan: parseFloat(row['Total Potongan']) || 0,
        pajak: parseFloat(row['Pajak']) || 0,
        gaji_bersih: parseFloat(row['Gaji Bersih']) || 0
      })).filter(s => s.no_slip); // Filter out empty rows

      // Filter by email or name if not admin
      if (userRole !== 'admin') {
        const filterEmail = userEmail || email;
        const userName = req.user?.name;
        if (filterEmail) {
          slipGaji = slipGaji.filter(s => 
            s.email.toLowerCase() === filterEmail.toLowerCase() ||
            (userName && s.nama.toLowerCase() === userName.toLowerCase())
          );
        } else if (userName) {
          slipGaji = slipGaji.filter(s => s.nama.toLowerCase() === userName.toLowerCase());
        } else {
          slipGaji = [];
        }
      } else if (email) {
        // Admin filtering by specific email
        slipGaji = slipGaji.filter(s => s.email.toLowerCase() === email.toLowerCase());
      }

      // Sort by date descending
      slipGaji.sort((a, b) => {
        const dateA = new Date(`${a.tahun}-${String(a.bulan).padStart(2, '0')}-01`);
        const dateB = new Date(`${b.tahun}-${String(b.bulan).padStart(2, '0')}-01`);
        return dateB - dateA;
      });

      res.json(slipGaji);
    } catch (error) {
      console.error('Error fetching slip gaji:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get single slip by no_slip
  router.get('/:noSlip', async (req, res) => {
    try {
      const { noSlip } = req.params;
      const userRole = req.user?.role;
      const userEmail = req.user?.email;

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

      const row = rows.find(r => r['No Slip'] === noSlip);
      
      if (!row) {
        return res.status(404).json({ error: 'Slip gaji not found' });
      }

      const slip = {
        no_slip: row['No Slip'] || '',
        tanggal: row['Tanggal'] || '',
        bulan: row['Bulan'] || '',
        tahun: row['Tahun'] || '',
        nama: row['Nama Lengkap'] || '',
        email: row['Email'] || '',
        departemen: row['Departemen'] || '',
        gaji_pokok: parseFloat(row['Gaji Pokok']) || 0,
        detail_tunjangan: row['Detail Tunjangan (JSON)'] || '[]',
        total_tunjangan: parseFloat(row['Total Tunjangan']) || 0,
        detail_bonus: row['Detail Bonus (JSON)'] || '[]',
        total_bonus: parseFloat(row['Total Bonus']) || 0,
        detail_potongan: row['Detail Potongan (JSON)'] || '[]',
        total_potongan: parseFloat(row['Total Potongan']) || 0,
        pajak: parseFloat(row['Pajak']) || 0,
        gaji_bersih: parseFloat(row['Gaji Bersih']) || 0
      };

      // Check access
      if (userRole !== 'admin' && slip.email.toLowerCase() !== userEmail?.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(slip);
    } catch (error) {
      console.error('Error fetching slip gaji:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get unique employees from slip gaji (for admin filter)
  router.get('/employees/list', async (req, res) => {
    try {
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

      const uniqueEmployees = [...new Map(rows.filter(r => r['Email']).map(r => [
        r['Email'], 
        { email: r['Email'], nama: r['Nama Lengkap'], departemen: r['Departemen'] }
      ])).values()];

      res.json(uniqueEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
