# 🎯 Himecrew App - Tracker Performa Departemen

Aplikasi web full-stack untuk tracking performa 3 departemen: **Host Live**, **Warehouse**, dan **Crewstore** dengan sistem KPI dan Checklist yang fleksibel.

![Status](https://img.shields.io/badge/status-ready-success)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

---

## ✨ Fitur Utama

### 🏠 Dashboard
- **Overview semua departemen** dengan card berwarna berbeda
- **Progress tracking** real-time untuk setiap departemen
- **Quick stats** - total tugas, completion rate, dan aktivitas
- **Kalender aktivitas** bulan ini

### 📺 Host Live
- Leaderboard ranking jam tayang bulanan
- Input sesi live dengan durasi otomatis
- Progress bar visual per host
- Daftar sesi live terbaru
- Set target jam bulanan per host

### 📦 Warehouse
- Checklist harian dengan template customizable
- Status completion real-time
- Riwayat checklist dengan filter tanggal
- Tracking siapa yang mengerjakan

### 🏪 Crewstore
- **Opening Checklist**: Jam buka, tugas harian, status keran
- **Closing Checklist**: Tugas closing, catatan surplus/deficit, jadwal shift besok
- Status visual (✓ selesai / ⏳ belum)

### ⚙️ Pengaturan
- Kelola staff dengan foto
- Buat dan edit template checklist
- Atur departemen

### 📊 Laporan
- Filter berdasarkan departemen dan periode
- Tabel completion rate dan progress KPI
- Export ke clipboard (format teks)

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS
- React Router
- Recharts (grafik)
- Lucide Icons

**Backend:**
- Node.js + Express
- Better-SQLite3 (database)
- JWT Authentication
- bcryptjs (password hashing)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### 3. Login

**Default credentials:**
- Username: `admin`
- Password: `admin123`

---

## 📁 Struktur Proyek

```
KPI-Himeku/
├── server/
│   ├── index.js              # Express server
│   ├── db/
│   │   └── schema.js         # Database schema & init
│   └── routes/
│       ├── auth.js           # Authentication
│       ├── dashboard.js      # Dashboard data
│       ├── hostlive.js       # Host Live KPI
│       ├── warehouse.js      # Warehouse checklist
│       ├── crewstore.js      # Crewstore opening/closing
│       ├── staff.js          # Staff management
│       ├── templates.js      # Checklist templates
│       └── reports.js        # Reports & export
├── src/
│   ├── components/
│   │   └── Layout.jsx        # Main layout + sidebar
│   ├── pages/
│   │   ├── Login.jsx         # Login page
│   │   ├── Dashboard.jsx     # Dashboard overview
│   │   ├── HostLive.jsx      # Host Live tracking
│   │   ├── Warehouse.jsx     # Warehouse checklist
│   │   ├── Crewstore.jsx     # Crewstore opening/closing
│   │   ├── Settings.jsx      # Settings management
│   │   └── Reports.jsx       # Reports & filtering
│   ├── App.jsx               # Main app router
│   └── main.jsx              # React entry point
└── database.db               # SQLite database (auto-created)
```

---

## 📊 Database Schema

**Tables:**
- `users` - User authentication
- `departments` - Department info (Host Live, Warehouse, Crewstore)
- `staff` - Staff members with photos
- `hosts` - Host Live targets
- `live_sessions` - Live streaming sessions
- `checklist_templates` - Customizable templates
- `warehouse_checklists` - Daily warehouse tasks
- `crewstore_opening` - Opening checklists
- `crewstore_closing` - Closing checklists

---

## 🎨 Desain & UX

- **Color-coded departments**: Red (Host Live), Blue (Warehouse), Green (Crewstore)
- **Modern card design**: Rounded corners, subtle shadows, gradient progress bars
- **Responsive layout**: Mobile-friendly untuk input dari smartphone
- **Visual status**: ✅ hijau (selesai), ⏳ kuning (proses), ❌ merah (belum)
- **Sidebar navigation**: Sticky sidebar dengan icons

---

## 📱 Mobile Responsive

Aplikasi fully responsive dengan:
- Hamburger menu untuk mobile
- Touch-friendly buttons
- Scrollable tables
- Optimized forms

---

## 🔐 Authentication

- JWT-based authentication
- Password hashing dengan bcrypt
- Protected routes
- Auto-logout on invalid token

---

## 📝 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/overview` - Dashboard data

### Host Live
- `GET /api/hostlive/hosts` - Get all hosts
- `POST /api/hostlive/hosts` - Create/update host
- `GET /api/hostlive/sessions` - Get sessions
- `POST /api/hostlive/sessions` - Add session

### Warehouse
- `GET /api/warehouse/checklists` - Get checklists
- `POST /api/warehouse/checklists` - Create checklist
- `PUT /api/warehouse/checklists/:id` - Update checklist
- `GET /api/warehouse/today` - Today's status

### Crewstore
- `GET /api/crewstore/opening` - Get opening checklists
- `POST /api/crewstore/opening` - Create opening
- `GET /api/crewstore/closing` - Get closing checklists
- `POST /api/crewstore/closing` - Create closing
- `GET /api/crewstore/today` - Today's status

### Staff & Templates
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff
- `GET /api/templates` - Get templates
- `POST /api/templates` - Create template

### Reports
- `GET /api/reports` - Get reports
- `GET /api/reports/export` - Export to text

---

## 🔄 Development Workflow

1. **Add Staff** di Settings → Kelola Staff
2. **Buat Template Checklist** di Settings → Template Checklist
3. **Add Host** di Host Live (pilih staff + set target)
4. **Input Jam Live** setiap host selesai streaming
5. **Buat Checklist Harian** di Warehouse
6. **Isi Opening & Closing** di Crewstore setiap hari
7. **Lihat Dashboard** untuk overview
8. **Export Laporan** untuk periode tertentu

---

## 🎯 Use Cases

**Manager/Admin:**
- Monitor performa semua departemen dari dashboard
- Set target KPI untuk setiap host
- Lihat laporan periode tertentu
- Kelola staff dan template

**Staff Host Live:**
- Input jam streaming setiap selesai live
- Lihat progress terhadap target bulanan

**Staff Warehouse:**
- Cek dan complete checklist harian
- Lihat riwayat pekerjaan

**Staff Crewstore:**
- Isi checklist opening pagi hari
- Isi checklist closing malam hari
- Input jadwal shift besok

---

## 🚧 Future Enhancements

- [ ] Push notifications untuk reminder checklist
- [ ] Role-based permissions (admin vs staff)
- [ ] Upload foto untuk checklist items
- [ ] Advanced charts & analytics
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration untuk notifikasi
- [ ] Backup & restore database
- [ ] Multi-branch support

---

## 📄 License

MIT License - Feel free to use and modify

---

## 👨‍💻 Author

Built with ❤️ for Himeku Team

---

## 🆘 Support

Untuk bantuan atau pertanyaan:
1. Check dokumentasi di atas
2. Review kode sumber
3. Contact developer

**Happy Tracking! 🎉**