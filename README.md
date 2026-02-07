# 🎯 Himecrew App - Sistem Manajemen KPI & Presensi

**Himecrew App** adalah platform manajemen kinerja komprehensif yang dirancang untuk mengelola berbagai departemen (Host Live, Content Creator, Warehouse, Crewstore). Aplikasi ini memadukan tracking KPI, checklist harian, presensi berbasis foto, dan manajemen penggajian dalam satu dashboard terintegrasi.

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Node.js%20%7C%20SQLite-indigo)

---

## ✨ Fitur Utama

### 1. 🏢 Multi-Departemen KPI
Setiap departemen memiliki modul khusus sesuai alur kerja mereka:

*   **📺 Host Live**:
    *   Leaderboard jam live streaming.
    *   Tracking durasi sesi live vs target bulanan.
    *   Riwayat sesi live harian.
*   **📸 Content Creator**:
    *   Tracking jumlah konten (Reels, Tiktok, Feed) vs target.
    *   Analitik performa konten (Views, Likes, Comments).
    *   Leaderboard "Top Creator".
    *   Kategorisasi konten berdasarkan platform dan tipe.
*   **📦 Warehouse**:
    *   Checklist operasional harian (Pagi/Siang/Sore).
    *   Riwayat pengerjaan checklist.
    *   Laporan aktivitas gudang.
*   **🏪 Crewstore**:
    *   **Opening Checklist**: Memastikan kesiapan toko sebelum buka.
    *   **Closing Checklist**: Laporan penutupan, hitung kas, dan catat surplus/minus.

### 2. 📸 Presensi & Kehadiran
*   **Absen Foto Real-time**: Staff melakukan absensi dengan melampirkan foto selfie.
*   **Integrasi Google Drive**: Foto tersimpan otomatis ke Google Drive via Apps Script.
*   **Rekap Kehadiran**: Admin dapat melihat riwayat kehadiran semua staff.

### 3. 💸 Manajemen SDM & Penggajian
*   **Database Staff**: Menyimpan data lengkap karyawan (Kontak, Bank Account, Posisi).
*   **Slip Gaji Digital**: Staff dapat melihat dan mengunduh slip gaji mereka langsung dari aplikasi.
*   **Struktur Jabatan**: Pengaturan role (Admin, Manager, Staff).

### 4. 📊 Laporan Otomatis
*   **Text Generator**: Membuat laporan teks terformat (siap kirim ke WhatsApp/Telegram) untuk KPI harian.
*   **Filter & Export**: Rekap data berdasarkan periode tanggal tertentu.

### 5. 🔐 Autentikasi & Keamanan
*   **Role-Based Access Control (RBAC)**:
    *   **Admin**: Akses penuh ke semua menu dan pengaturan.
    *   **Staff**: Akses terbatas sesuai departemen masing-masing.

---

## 🛠️ Tech Stack & Arsitektur

### Frontend
*   **Framework**: React 18 (Vite)
*   **Styling**: TailwindCSS
*   **Routing**: React Router DOM v6
*   **Icons**: Lucide React
*   **Charts**: Recharts

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: Better-SQLite3 (File-based SQL)
*   **Auth**: JWT (JSON Web Tokens) & Bcrypt

### Integrasi Eksternal
*   **Google Apps Script**: Untuk jembatan upload foto presensi ke Google Drive.

---

## 🗄️ Struktur Database & Alur Data

Database menggunakan SQLite dengan tabel relasional utama sebagai berikut:

1.  **`users`**: Menyimpan kredensial login (username, hash password) dan role.
2.  **`staff`**: Data profil karyawan yang terhubung ke department.
3.  **`departments`**: Master data departemen (warna, icon).
4.  **`attendance`**: Log presensi harian (jam masuk, foto).
5.  **Tabel KPI Spesifik**:
    *   `content_creator_posts`: Data postingan sosmed.
    *   `live_sessions`: Log durasi live streaming.
    *   `warehouse_checklists`: Log tugas gudang.
    *   `store_checklist_header` & `items`: Log buka/tutup toko.

### Alur Kerja (Flow)
1.  **Auth**: User login -> Server validasi -> Terima Token JWT.
2.  **Role Check**: Dashboard merender menu berdasarkan `role` dan `department_id` user.
3.  **Input Data**: User menginput data (misal: link konten) -> Server validasi -> Simpan ke DB.
4.  **Reporting**: Sistem mengagregasi data harian/bulanan untuk ditampilkan di Grafik Dashboard.

---

## 🔌 API Routes

Berikut adalah endpoint utama yang tersedia di server (`server/index.js`):

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login user & generate token |
| `GET` | `/api/dashboard/stats` | Statistik umum untuk halaman depan |
| `GET/POST` | `/api/presensi` | Absensi & Cek riwayat |
| `GET/POST` | `/api/staff` | CRUD Data Staff |
| `GET/POST` | `/api/contentcreator` | Manajemen konten & target creator |
| `GET/POST` | `/api/hostlive` | Manajemen sesi live |
| `GET/POST` | `/api/warehouse` | Manajemen checklist gudang |
| `GET/POST` | `/api/crewstore` | Opening & Closing toko |
| `GET` | `/api/slipgaji` | Akses data penggajian |
| `GET` | `/api/reports` | Generate laporan teks |

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
Perintah ini akan menjalankan frontend (Vite) dan backend (Express) secara bersamaan.
```bash
npm run dev
```
*   Frontend: `http://localhost:5173`
*   Backend: `http://localhost:5000`

### 3. Login Awal
Secara default, database akan membuat akun admin jika belum ada:
*   **Username**: `admin`
*   **Password**: `admin123`

*(Catatan: Segera ganti password atau buat user baru setelah login pertama kali)*

---

## 📝 Konfigurasi Tambahan

### Upload Foto (Google Drive)
Untuk fitur upload foto presensi, lihat panduan di `DEPLOYMENT.md` untuk setup Google Apps Script.
