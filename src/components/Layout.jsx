import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  Package, 
  Store, 
  Settings as SettingsIcon, 
  FileText, 
  LogOut,
  Menu,
  X,
  Camera,
  Instagram,
  Receipt,
  ClipboardList
} from 'lucide-react';

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const userDeptId = user?.department_id;

  // Menu yang bisa dilihat semua orang
  const commonMenus = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Presensi', path: '/presensi', icon: Camera },
    { name: 'Slip Gaji', path: '/slipgaji', icon: Receipt },
  ];

  // Menu per departemen
  const departmentMenus = {
    1: [{ name: 'Crewstore', path: '/crewstore', icon: Store }], // Crew Store
    2: [{ name: 'Warehouse', path: '/warehouse', icon: Package }], // Warehouse
    3: [{ name: 'Host Live', path: '/hostlive', icon: Video }], // Host Live
    4: [{ name: 'Content Creator', path: '/contentcreator', icon: Instagram }], // Content Creator
  };

  // Menu khusus admin
  const adminMenus = [
    { name: 'Rekap Presensi', path: '/rekap-presensi', icon: ClipboardList },
    { name: 'Host Live', path: '/hostlive', icon: Video },
    { name: 'Content Creator', path: '/contentcreator', icon: Instagram },
    { name: 'Warehouse', path: '/warehouse', icon: Package },
    { name: 'Crewstore', path: '/crewstore', icon: Store },
    { name: 'Laporan', path: '/reports', icon: FileText },
    { name: 'Pengaturan', path: '/settings', icon: SettingsIcon },
  ];

  // Build navigation based on user role and department
  let navigation = [...commonMenus];
  
  if (isAdmin) {
    navigation = [...navigation, ...adminMenus];
  } else if (userDeptId && departmentMenus[userDeptId]) {
    navigation = [...navigation, ...departmentMenus[userDeptId]];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-40 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">KPI Himeku</h1>
          <p className="text-sm text-gray-500 mt-1">Tracker Performa</p>
        </div>

        <nav className="px-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
