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
  ClipboardList,
  MoreHorizontal
} from 'lucide-react';

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // For mobile bottom bar: show max 4 items + "More" if needed
  const mobileMainMenus = navigation.slice(0, 4);
  const mobileMoreMenus = navigation.slice(4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Himecrew App</h1>
          <p className="text-sm text-gray-500 mt-1">Tracker Performa</p>
        </div>

        <nav className="px-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
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

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-40 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-gray-800">Himecrew App</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{user?.name?.split(' ')[0]}</span>
          <button
            onClick={onLogout}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex items-center justify-around h-16">
          {mobileMainMenus.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          {/* More button if there are additional menus */}
          {mobileMoreMenus.length > 0 && (
            <div className="relative flex-1 h-full">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                  showMoreMenu || mobileMoreMenus.some(m => m.path === location.pathname) 
                    ? 'text-blue-600' 
                    : 'text-gray-500'
                }`}
              >
                <MoreHorizontal size={22} />
                <span className="text-[10px] mt-1 font-medium">Lainnya</span>
              </button>

              {/* More menu popup */}
              {showMoreMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border z-50 py-2 max-h-64 overflow-y-auto">
                    {mobileMoreMenus.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setShowMoreMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                            isActive 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
