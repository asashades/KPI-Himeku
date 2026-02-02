# KPI & Checklist Tracker

Aplikasi tracking performa untuk 3 departemen: **Host Live**, **Warehouse**, dan **Crewstore** dengan sistem KPI dan Checklist yang fleksibel.

## 🛠️ Tech Stack

- **Framework**: Angular 21 (latest stable version)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Material Icons
- **Storage**: Local Storage

## 📋 Features

### 1. Dashboard
- Overview semua departemen dengan cards berwarna
- Progress tracking untuk Host Live
- Status checklist untuk Crewstore
- Quick stats dan mini calendar

### 2. Host Live
- Daftar host dengan progress bar
- Input jam live dengan auto-calculate duration
- Monthly leaderboard dengan ranking dan badges
- Statistics per host

### 3. Crewstore
- Opening checklist dengan berbagai tipe input
- Closing checklist dengan schedule management
- History tracking untuk semua submissions

### 4. Settings
- Manage staff per departemen
- Manage departemen (add/edit/delete)
- Template checklist management

### 5. Warehouse & Reports
- Placeholder pages untuk development selanjutnya

## 🚀 Setup Instructions

### Prerequisites
- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm start
# or
ng serve

# Build for production
npm run build
# or
ng build
```

### Development server
Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## 📁 Project Structure

```
src/
├── app/
│   ├── components/          # Reusable components
│   │   └── layout/         # Main layout with sidebar & bottom nav
│   ├── pages/              # Page components
│   │   ├── dashboard/      # Dashboard page
│   │   ├── host-live/      # Host Live tracking
│   │   ├── crewstore/      # Crewstore checklists
│   │   ├── settings/       # Settings management
│   │   ├── warehouse/      # Warehouse (placeholder)
│   │   └── reports/        # Reports (placeholder)
│   ├── services/           # Business logic services
│   │   ├── storage.service.ts
│   │   ├── department.service.ts
│   │   ├── checklist.service.ts
│   │   ├── host.service.ts
│   │   └── staff.service.ts
│   ├── shared/             # Shared components
│   │   ├── card/
│   │   ├── progress-bar/
│   │   └── status-badge/
│   ├── models/             # TypeScript interfaces
│   └── app.routes.ts       # Routing configuration
├── styles.css              # Global styles with Tailwind
└── index.html
```

## 🎨 Design System

### Color Palette
- **Host Live**: #8B5CF6 (Violet)
- **Warehouse**: #F59E0B (Amber)
- **Crewstore**: #10B981 (Emerald)

### Responsive Breakpoints
- **Mobile**: < 768px (bottom navigation, stacked cards)
- **Tablet**: 768px - 1024px (sidebar collapsed, 2 column grid)
- **Desktop**: > 1024px (full sidebar, 3 column grid)

## 💾 Data Storage

All data is stored in browser's Local Storage:
- Departments
- Hosts & Live Sessions
- Checklist Templates & Submissions
- Staff Members

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests

## 📝 Default Data

The application comes with seed data:
- 3 Departments: Host Live, Warehouse, Crewstore
- 5 Hosts with different target hours
- 9 Staff members (3 per department)
- 2 Checklist templates for Crewstore (Opening & Closing)

## 🌟 Key Features

- ✅ Responsive design (mobile-first approach)
- ✅ Material Icons integration
- ✅ Tailwind CSS styling
- ✅ TypeScript strict mode
- ✅ Local Storage persistence
- ✅ Reusable components
- ✅ Service-based architecture
- ✅ Clean and modern UI

## 🚧 Future Enhancements

- Warehouse management features
- Reports and analytics
- Data export functionality
- Multi-user support
- Backend integration
- Real-time updates

## 📄 License

This project is for internal use.

---

**Built with** ❤️ **using Angular**
