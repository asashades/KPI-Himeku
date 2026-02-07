# 🎯 Himecrew App - Sistem Manajemen KPI & Presensi

**Himecrew App** adalah platform manajemen kinerja komprehensif yang dirancang untuk mengelola berbagai departemen (Host Live, Content Creator, Warehouse, Crewstore). Aplikasi ini memadukan tracking KPI, checklist harian, presensi berbasis foto, dan manajemen penggajian dalam satu dashboard terintegrasi.

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Node.js%20%7C%20SQLite-indigo)

---

## ✨ Fitur Utama

### 1. 🏢 Multi-Departemen KPI
Setiap departemen memiliki modul khusus sesuai alur kerja mereka:

*   **📺 Host Live (Integrasi Google Spreadsheet)**:
    *   **Data Source**: Data diambil otomatis dari Google Spreadsheet (`RekapLive`), sehingga tidak ada form input manual di aplikasi.
    *   **Leaderboard**: Peringkat host berdasarkan durasi live mingguan/bulanan.
    *   **Progress Tracking**: Grafik pencapaian target jam live streaming secara real-time.
    *   **Riwayat**: Daftar sesi live yang tersinkronisasi dari spreadsheet.

*   **📸 Content Creator**:
    *   **Input Konten**: Form untuk memasukkan link konten (TikTok, Instagram Reels).
    *   **Target Bulanan**: Setting target jumlah postingan per creator.
    *   **Analitik**: Tracking performa konten (Views, Likes).
    *   **Kategori**: Filter konten berdasarkan platform dan jenis (Video/Foto).

*   **📦 Warehouse**:
    *   **Checklist Berjenjang**: Sistem checklist operasional dibagi per shift (Pagi, Siang, Sore).
    *   **Monitoring**: Manager dapat memantau status checklist secara real-time (Selesai/Belum).
    *   **Log User**: Mencatat siapa yang mengerjakan setiap item checklist.
    *   **Laporan Gudang**: Rekapitulasi keakuratan pesanan dan kondisi gudang.

*   **🏪 Crewstore**:
    *   **Opening Checklist**: Memastikan kesiapan toko sebelum jam operasional (kebersihan, stok display).
    *   **Closing Checklist**: Laporan penutupan toko, hitung fisik uang kas, dan catatan surplus/minus.
    *   **Shift Handover**: Catatan penting untuk shift berikutnya.

### 2. 📸 Presensi & Kehadiran
*   **Absen Foto Real-time**: Staff melakukan absensi dengan wajib melampirkan foto selfie.
*   **Integrasi Google Drive**: Foto tersimpan otomatis ke Google Drive via Apps Script (Serverless), mengurangi beban penyimpanan server.
*   **Rekap Kehadiran**: Admin dapat melihat log kehadiran (Jam Masuk/Pulang) semua staff.

### 3. 💸 Manajemen SDM & Penggajian
*   **Slip Gaji Digital (Integrasi Google Spreadsheet)**:
    *   **Data Source**: Data penggajian diambil langsung dari Google Spreadsheet (`Rekap_Gaji`).
    *   **Akses Personal**: Staff hanya bisa melihat slip gaji mereka sendiri berdasarkan kecocokan email/ID.
    *   **Downloadable**: Slip gaji dapat diunduh atau di-screenshot untuk keperluan administrasi staff.
*   **Database Staff**: Menyimpan data lengkap karyawan (Kontak, Bank Account, Posisi).
*   **Struktur Jabatan**: Pengaturan role (Admin, Manager, Staff).

### 4. 📊 Dashboard & Laporan
*   **Smart Dashboard**:
    *   **Data Aggregation**: Chart dan statistik utama diambil dari gabungan data database lokal (SQLite) dan data eksternal (Google Sheets).
    *   **Gen-Z Insights**: Pesan penyemangat dinamis (AI-style) berdasarkan performa harian tim.
    *   **Real-time Alerts**: Notifikasi jika Opening/Closing toko belum dilakukan atau ada checklist gudang yang terlewat.
*   **Auto-Text Reports**: Generator teks laporan KPI harian format WhatsApp/Telegram.

---

## 🛠️ Tech Stack & Arsitektur

### Frontend
*   **Framework**: React 18 (Vite)
*   **Styling**: TailwindCSS
*   **Data Viz**: Recharts (Grafik & Chart)
*   **Icons**: Lucide React

### Backend
*   **Runtime**: Node.js & Express.js
*   **Database**: Better-SQLite3 (File-based RDBMS)
*   **Spreadsheet Integration**: Fetch API ke Google Sheets JSON endpoint (Tanpa perlu OAuth yang rumit untuk read-only).
*   **Auth**: JWT (JSON Web Tokens) & Bcrypt

### Integrasi Eksternal
*   **Google Apps Script**: Middleware untuk upload foto presensi ke Google Drive.
*   **Google Sheets**: Database backend untuk data Host Live dan Penggajian.

---

## 🗄️ Struktur Database & Alur Data

### Sumber Data Hibrida
Aplikasi ini menggunakan pendekatan **Hybrid Data Source**:
1.  **SQLite (Lokal)**: Menyimpan data User, Staff, Checklist Warehouse, Checklist Store, dan Target Content Creator.
2.  **Google Sheets (Cloud)**: Menyimpan data Transaksional berat seperti Log Live Streaming dan Perhitungan Gaji.

### Schema SQLite Utama
1.  **`users`**: Kredensial login & Role.
2.  **`staff`**: Profil karyawan.
3.  **`attendance`**: Log presensi & URL foto.
4.  **`content_creator_posts`**: Data postingan sosmed.
5.  **`warehouse_checklists`**: Log tugas gudang.
6.  **`store_checklists`**: Log buka/tutup toko.

### Alur Kerja Dashboard Chart
1.  **Request**: Client (React) me-request `/api/dashboard/overview`.
2.  **Backend Processing**:
    *   Query SQLite untuk progres Creator, Warehouse, dan Store.
    *   Fetch API ke Google Sheet `RekapLive` untuk menghitung total jam live bulan ini.
3.  **Aggregation**: Server menggabungkan kedua sumber data tersebut.
4.  **Response**: JSON dikirim ke Frontend untuk dirender menjadi Grafik Bar/Pie Chart oleh Recharts.

---

## 🔌 API Routes

Berikut adalah endpoint utama yang tersedia di server (`server/index.js`):

| Method | Endpoint | Sumber Data | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/overview` | **Hybrid** | Statistik gabungan untuk dashboard |
| `POST` | `/api/auth/login` | SQLite | Login user & generate token |
| `GET` | `/api/hostlive/sessions` | **Google Sheets** | Mengambil data sesi live streaming |
| `GET` | `/api/slipgaji` | **Google Sheets** | Mengambil data gaji personal |
| `GET/POST` | `/api/presensi` | SQLite + GDrive | Absensi & Cek riwayat |
| `GET/POST` | `/api/contentcreator` | SQLite | Manajemen konten & target creator |
| `GET/POST` | `/api/warehouse` | SQLite | Manajemen checklist gudang |
| `GET/POST` | `/api/crewstore` | SQLite | Opening & Closing toko |

---

## 🚀 Cara Menjalankan

### Prasyarat
*   Node.js (v16+)
*   NPM

### 1. Instalasi
```bash
npm install
```

### 2. Jalankan Mode Development
```bash
npm run dev
```
*   Frontend: `http://localhost:5173`
*   Backend: `http://localhost:5000`

### 3. Login Awal
*   **Username**: `admin`
*   **Password**: `admin123`

---

## 📝 Konfigurasi Tambahan

### Integrasi Google Sheets
Pastikan Spreadsheet ID di `server/routes/hostlive.js` dan `server/routes/slipgaji.js` sudah diubah ke spreadsheet milik Anda dan diset ke **"Anyone with the link can view"** agar API bisa membacanya.

### Upload Foto
Lihat panduan di `DEPLOYMENT.md` untuk setup Google Apps Script.
