import bcrypt from 'bcryptjs';

export async function initializeDatabase(db) {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'staff',
      department_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add email and department_id columns if missing
  try { await db.exec(`ALTER TABLE users ADD COLUMN email TEXT`); } catch (e) {}
  try { await db.exec(`ALTER TABLE users ADD COLUMN department_id INTEGER`); } catch (e) {}

  // Departments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Staff table - Extended with employee details
  await db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      photo_url TEXT,
      department_id INTEGER,
      position TEXT,
      role TEXT DEFAULT 'Staff',
      join_date DATE,
      phone TEXT,
      bank_name TEXT,
      bank_account TEXT,
      city TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add new columns to staff if missing
  try { await db.exec(`ALTER TABLE staff ADD COLUMN email TEXT`); } catch (e) {}
  try { await db.exec(`ALTER TABLE staff ADD COLUMN position TEXT`); } catch (e) {}
  try { await db.exec(`ALTER TABLE staff ADD COLUMN role TEXT DEFAULT 'Staff'`); } catch (e) {}
  try { await db.exec(`ALTER TABLE staff ADD COLUMN join_date DATE`); } catch (e) {}
  try { await db.exec(`ALTER TABLE staff ADD COLUMN phone TEXT`); } catch (e) {}
  try { await db.exec(`ALTER TABLE staff ADD COLUMN bank_name TEXT`); } catch (e) {}
  try { await db.exec(`ALTER TABLE staff ADD COLUMN bank_account TEXT`); } catch (e) {}
  try { await db.exec(`ALTER TABLE staff ADD COLUMN city TEXT`); } catch (e) {}

  // Host Live - Hosts and their targets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      monthly_target_hours REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Host Live - Live sessions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS live_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      duration_hours REAL NOT NULL,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Checklist templates
  await db.exec(`
    CREATE TABLE IF NOT EXISTS checklist_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      items TEXT NOT NULL,
      tap_enabled INTEGER DEFAULT 1,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add tap_enabled column if missing
  try { await db.exec(`ALTER TABLE checklist_templates ADD COLUMN tap_enabled INTEGER DEFAULT 1`); } catch (e) {}

  // Warehouse checklists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS warehouse_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      template_id INTEGER NOT NULL,
      items TEXT NOT NULL,
      completed_by INTEGER,
      completed_at DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crewstore opening checklists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS crewstore_opening (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      open_time TIME NOT NULL,
      items TEXT NOT NULL,
      tap_status TEXT,
      tap_notes TEXT,
      completed_by INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crewstore closing checklists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS crewstore_closing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      items TEXT NOT NULL,
      additional_notes TEXT,
      next_shift_morning TEXT,
      next_shift_afternoon TEXT,
      next_shift_stock TEXT,
      daily_sales INTEGER DEFAULT 0,
      completed_by INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add daily_sales column if missing
  try { await db.exec(`ALTER TABLE crewstore_closing ADD COLUMN daily_sales INTEGER DEFAULT 0`); } catch (e) {}

  // Presensi (Attendance) table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS presensi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      timestamp DATETIME NOT NULL,
      jenis TEXT NOT NULL,
      shift TEXT NOT NULL,
      foto_url TEXT,
      latitude REAL,
      longitude REAL,
      late_minutes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add late_minutes column if missing
  try { await db.exec(`ALTER TABLE presensi ADD COLUMN late_minutes INTEGER DEFAULT 0`); } catch (e) {}

  // Warehouse Daily Reports table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS warehouse_daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      spx INTEGER DEFAULT 0,
      jnt INTEGER DEFAULT 0,
      total_kiriman INTEGER DEFAULT 0,
      pending TEXT,
      restock TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Warehouse Wrong Orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS warehouse_wrong_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      order_id TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'wrong_item',
      status TEXT DEFAULT 'pending',
      reported_by INTEGER,
      resolved_by INTEGER,
      resolution_notes TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Content Creator KPI table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS content_creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      monthly_target_posts INTEGER DEFAULT 0,
      monthly_target_views INTEGER DEFAULT 0,
      monthly_target_engagement REAL DEFAULT 0,
      platforms TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add missing columns for content_creators if exists
  try { await db.exec(`ALTER TABLE content_creators ADD COLUMN monthly_target_posts INTEGER DEFAULT 0`); } catch (e) {}
  try { await db.exec(`ALTER TABLE content_creators ADD COLUMN platforms TEXT`); } catch (e) {}
  try { await db.exec(`ALTER TABLE host_live_imports ADD COLUMN created_by INTEGER`); } catch (e) {}

  // Content Creator Posts/Content table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS content_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      date DATE NOT NULL,
      platform TEXT NOT NULL,
      content_type TEXT NOT NULL,
      title TEXT,
      url TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Host Live Import Records table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS host_live_imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rekap_id TEXT UNIQUE,
      email_host TEXT,
      nama_host TEXT NOT NULL,
      tanggal_live DATE NOT NULL,
      jam_mulai TIME NOT NULL,
      jam_selesai TIME NOT NULL,
      durasi_jam REAL NOT NULL,
      gaji INTEGER DEFAULT 0,
      host_id INTEGER,
      imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Department KPI Settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS department_kpi_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL UNIQUE,
      kpi_config TEXT NOT NULL,
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default data
  const departmentCount = await db.get('SELECT COUNT(*) as count FROM departments');
  if (departmentCount.count === 0) {
    await db.run(`INSERT INTO departments (name, color, icon) VALUES ('Crew Store', 'green', 'Store')`);
    await db.run(`INSERT INTO departments (name, color, icon) VALUES ('Warehouse', 'blue', 'Package')`);
    await db.run(`INSERT INTO departments (name, color, icon) VALUES ('Host Live', 'red', 'Video')`);
    await db.run(`INSERT INTO departments (name, color, icon) VALUES ('Content Creator', 'pink', 'Instagram')`);
  }

  // Create default admin user if not exists
  const adminExists = await db.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
  if (adminExists.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.run('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin', hashedPassword, 'Administrator', 'admin']);
  }

  // All employees data
  const employees = [
    { name: 'Ananda Raihan Faj', email: 'anandaraihanfaj@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-01-10', phone: '81234567890', bank_name: null, bank_account: null, city: 'Kota Surakarta', active: 1 },
    { name: 'Desas Noel Pitaloka', email: 'desasnoelp@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2023-06-01', phone: '81298765432', bank_name: 'BRI', bank_account: '310301035113532', city: 'Kota Surakarta', active: 0 },
    { name: 'Bernandetta Egidea T', email: 'deatannasa@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2023-06-01', phone: '81311223344', bank_name: 'MANDIRI', bank_account: '1380024006111', city: 'Kota Surakarta', active: 1 },
    { name: 'Eka Yunanda', email: 'yunaeka114@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-06-01', phone: null, bank_name: 'BRI', bank_account: '216701012306501', city: 'Kota Madiun', active: 1 },
    { name: 'Ghizca Alvinesha', email: 'ghizca2720@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2025-06-02', phone: null, bank_name: 'BCA', bank_account: '0790595009', city: 'Kota Surakarta', active: 1 },
    { name: 'Stefhanie Thirza Hapsari Setyaning Budi', email: 'stefhaniethirza@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-01-03', phone: null, bank_name: 'BCA', bank_account: '0154739412', city: 'Kab Karanganyar', active: 1 },
    { name: 'Shakila Dwi Yulianti', email: 'Shakiladwiy@gmail.com', department_id: 4, position: 'Creative', role: 'Staff', join_date: '2025-08-26', phone: null, bank_name: 'MANDIRI', bank_account: '1380022960079', city: 'Kota Surakarta', active: 1 },
    { name: 'Khamdan Muhammad Rifqi', email: 'khamdan1998@gmail.com', department_id: 2, position: 'Team Packing', role: 'Staff', join_date: '2023-06-01', phone: null, bank_name: 'BRI', bank_account: '673701013619530', city: 'Kota Surakarta', active: 1 },
    { name: 'Rosenna Olivia Paryudi', email: 'olivia.paryudi@gmail.com', department_id: 4, position: 'Content Creator', role: 'Staff', join_date: '2025-03-01', phone: null, bank_name: 'BCA', bank_account: '0374172545', city: 'Kota Surakarta', active: 1 },
    { name: 'Isti Nuriyah', email: 'istinuriyah14@gmail.com', department_id: 2, position: 'Manager', role: 'Staff', join_date: '2023-06-01', phone: null, bank_name: 'BRI', bank_account: '137901021776507', city: 'Kabupaten Wonosobo', active: 1 },
    { name: 'Annisa Devi Lianna', email: 'annisadeviliana@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2023-06-01', phone: null, bank_name: 'BRI', bank_account: '137901021722508', city: 'Kabupaten Wonosobo', active: 1 },
    { name: 'Laksmita Herdini Nuraini', email: 'lakshmi.lawliet22@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2024-10-01', phone: null, bank_name: 'Seabank', bank_account: '901754363496', city: 'Kota Surakarta', active: 1 },
    { name: 'Laila Maulidiah', email: 'maulidiahlaila7@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2024-10-01', phone: null, bank_name: 'BSI', bank_account: '7201493565', city: 'Kota Surakarta', active: 0 },
    { name: 'Deliana Fairuz Fahriyah', email: 'delianafairuz5@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2024-10-12', phone: null, bank_name: 'Blu BCA', bank_account: '003911415318', city: 'Kota Tegal', active: 0 },
    { name: 'Fadhila Putri', email: 'fdhlaaputri@gmail.com', department_id: 1, position: 'Crew Store', role: 'Staff', join_date: '2025-06-02', phone: null, bank_name: 'BCA', bank_account: '77335554107', city: 'Kota Surakarta', active: 1 },
    { name: 'Puguh Priyo Cahyono', email: 'puguhpriyo707@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-03-01', phone: null, bank_name: 'MANDIRI', bank_account: '1380024260528', city: 'Kab Karanganyar', active: 1 },
    { name: 'Mustika Ayu Rahmadhani', email: 'mustikaayu374@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2024-01-11', phone: null, bank_name: 'GOPAY', bank_account: '085702328298', city: 'Kota Surakarta', active: 1 },
    { name: 'Larissa Doraltina', email: 'rezadethan2002@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2025-07-01', phone: null, bank_name: 'BCA', bank_account: '3940734257', city: 'Kabupaten Sumbawa', active: 1 },
    { name: 'Vania Christella', email: 'vaniachristella17@gmail.com', department_id: 4, position: 'Creative', role: 'Staff', join_date: '2025-08-26', phone: null, bank_name: null, bank_account: null, city: 'Kota Surakarta', active: 1 },
    { name: 'Fadhillah Fatimah Az-Zahro', email: 'dillaazzahro@students.uns.ac.id', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2026-01-13', phone: null, bank_name: 'BNI', bank_account: '830717024', city: 'Kota Surakarta', active: 1 },
    { name: 'Akbar Maulana Rifki', email: 'akbarmaulanarifki@gmail.com', department_id: 3, position: 'Host Live', role: 'Staff', join_date: '2026-01-13', phone: null, bank_name: 'Bank Jago', bank_account: '103993530192', city: 'Kota Surakarta', active: 1 }
  ];

  // Helper function to create username from name
  const createUsername = (name) => {
    const firstName = name.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  // Create user accounts for all employees
  for (const e of employees) {
    const username = createUsername(e.name);
    const password = username + '123';
    const exists = await db.get('SELECT COUNT(*) as count FROM users WHERE email = ?', [e.email]);
    if (exists.count === 0) {
      const hashed = bcrypt.hashSync(password, 10);
      await db.run('INSERT INTO users (username, password, name, email, role, department_id) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashed, e.name, e.email, 'staff', e.department_id]);
    }
  }

  // Seed employees data to staff table
  const staffCount = await db.get('SELECT COUNT(*) as count FROM staff');
  if (staffCount.count === 0) {
    for (const e of employees) {
      await db.run(`
        INSERT INTO staff (name, email, department_id, position, role, join_date, phone, bank_name, bank_account, city, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [e.name, e.email, e.department_id, e.position, e.role, e.join_date, e.phone, e.bank_name, e.bank_account, e.city, e.active]);
    }
  }

  // Insert default checklist templates if not exists
  const templateCount = await db.get('SELECT COUNT(*) as count FROM checklist_templates');
  if (templateCount.count === 0) {
    await db.run(`INSERT INTO checklist_templates (department_id, name, type, items) VALUES (?, ?, ?, ?)`,
      [2, 'Default Warehouse Checklist', 'daily', JSON.stringify([
        { id: 1, text: 'Cek stok barang', required: true },
        { id: 2, text: 'Verifikasi pesanan masuk', required: true },
        { id: 3, text: 'Packing barang ready', required: true },
        { id: 4, text: 'Update inventory', required: false }
      ])]);
    await db.run(`INSERT INTO checklist_templates (department_id, name, type, items) VALUES (?, ?, ?, ?)`,
      [1, 'Crewstore Opening', 'opening', JSON.stringify([
        { id: 1, text: 'Nyapu lantai', required: true },
        { id: 2, text: 'Ngepel', required: true },
        { id: 3, text: 'Lap kaca', required: true },
        { id: 4, text: 'Cek kasir', required: true }
      ])]);
    await db.run(`INSERT INTO checklist_templates (department_id, name, type, items) VALUES (?, ?, ?, ?)`,
      [1, 'Crewstore Closing', 'closing', JSON.stringify([
        { id: 1, text: 'Hitung kas', required: true },
        { id: 2, text: 'Bersihkan kasir', required: true },
        { id: 3, text: 'Rapikan display', required: true },
        { id: 4, text: 'Matikan lampu', required: true }
      ])]);
  }
}
