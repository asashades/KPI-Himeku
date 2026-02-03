import { useState, useEffect } from 'react';
import { Users, ListChecks, Plus, Edit2, Trash2, Settings as SettingsIcon, Target, X, UserCog, Building2, Sparkles } from 'lucide-react';

const encourageMessages = [
  "Settings game strong bestie! ⚙️",
  "Admin mode: ACTIVATED! 🔥",
  "Main character energy in management! 💅",
  "Slay those settings king/queen! 👑",
  "Your admin skills are immaculate fr fr! ✨"
];

const getRandomEncourage = () => encourageMessages[Math.floor(Math.random() * encourageMessages.length)];

export default function Settings({ user }) {
  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [kpiSettings, setKpiSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingKpi, setEditingKpi] = useState(null);
  const [encourageMsg] = useState(getRandomEncourage());

  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: 'Bearer ' + token };
      const [staffRes, templatesRes, departmentsRes] = await Promise.all([
        fetch('/api/staff', { headers }),
        fetch('/api/templates', { headers }),
        fetch('/api/departments', { headers })
      ]);
      setStaff(await staffRes.json());
      setTemplates(await templatesRes.json());
      setDepartments(await departmentsRes.json());

      if (isAdmin) {
        const [usersRes, kpiRes] = await Promise.all([
          fetch('/api/auth/users', { headers }),
          fetch('/api/departments/kpi-settings', { headers })
        ]);
        setUsers(await usersRes.json());
        const kpiData = await kpiRes.json();
        setKpiSettings(Array.isArray(kpiData) ? kpiData : []);
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  // Staff handlers
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      department_id: formData.get('department_id') || null,
      position: formData.get('position'),
      role: formData.get('role') || 'Staff',
      join_date: formData.get('join_date'),
      phone: formData.get('phone'),
      bank_name: formData.get('bank_name'),
      bank_account: formData.get('bank_account'),
      city: formData.get('city'),
      active: formData.get('active') === 'on' ? 1 : 0
    };
    try {
      const token = localStorage.getItem('token');
      const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff';
      const res = await fetch(url, {
        method: editingStaff ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) { setShowStaffForm(false); setEditingStaff(null); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm('Hapus karyawan ini? 🙈')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/staff/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  // Template handlers
  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const itemsText = formData.get('items');
    const items = itemsText.split('\n').filter(line => line.trim()).map((line, index) => ({
      id: index + 1,
      text: line.trim().replace(/\*$/, ''),
      required: line.trim().endsWith('*')
    }));
    const data = {
      department_id: formData.get('department_id'),
      name: formData.get('name'),
      type: formData.get('type'),
      items,
      tap_enabled: formData.get('tap_enabled') === 'on'
    };
    try {
      const token = localStorage.getItem('token');
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const res = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) { setShowTemplateForm(false); setEditingTemplate(null); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Hapus template ini? 🙈')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/templates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  // User handlers
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      username: formData.get('username'),
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      department_id: formData.get('department_id') || null
    };
    if (formData.get('password')) data.password = formData.get('password');
    try {
      const token = localStorage.getItem('token');
      const url = editingUser ? `/api/auth/users/${editingUser.id}` : '/api/auth/register';
      const res = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) { setShowUserForm(false); setEditingUser(null); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Hapus user ini? 🙈')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  // KPI handlers
  const handleKpiSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const deptId = parseInt(formData.get('department_id'));
    
    // Build KPI config based on department
    const kpi_config = {
      description: formData.get('description') || ''
    };
    
    // Host Live (dept 3) - target hours
    if (deptId === 3) {
      kpi_config.target_hours = parseFloat(formData.get('target_hours')) || 0;
    }
    // Content Creator (dept 4) - target posts
    if (deptId === 4) {
      kpi_config.target_posts = parseInt(formData.get('target_posts')) || 0;
    }
    // Warehouse (dept 2) - max wrong orders
    if (deptId === 2) {
      kpi_config.max_wrong_orders = parseInt(formData.get('max_wrong_orders')) || 5;
    }
    // Crew Store (dept 1) - target sales
    if (deptId === 1) {
      kpi_config.target_sales = parseInt(formData.get('target_sales')) || 0;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/departments/${deptId}/kpi-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kpi_config })
      });
      if (res.ok) { setShowKpiForm(false); setEditingKpi(null); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'staff', name: 'Karyawan', icon: Users },
    { id: 'templates', name: 'Template', icon: ListChecks },
    ...(isAdmin ? [
      { id: 'users', name: 'Users', icon: UserCog },
      { id: 'kpi', name: 'KPI', icon: Target }
    ] : [])
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-blue-500" /> Pengaturan
        </h1>
        <p className="text-gray-600 mt-1">Kelola data sistem - Let's manage it bestie! ⚙️</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <p className="font-medium text-lg">{encourageMsg}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon size={18} /> {tab.name}
          </button>
        ))}
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Data Karyawan 👥</h2>
            <button onClick={() => { setEditingStaff(null); setShowStaffForm(true); }}
              className="btn btn-primary flex items-center gap-2">
              <Plus size={18} /> Tambah
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Departemen</th>
                  <th className="px-4 py-3 text-left">Posisi</th>
                  <th className="px-4 py-3 text-left">Bank</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email || '-'}</td>
                    <td className="px-4 py-3">{s.department_name || '-'}</td>
                    <td className="px-4 py-3">{s.position || '-'}</td>
                    <td className="px-4 py-3 text-xs">{s.bank_name ? `${s.bank_name} - ${s.bank_account}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${s.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingStaff(s); setShowStaffForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteStaff(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Template Checklist 📋</h2>
            <button onClick={() => { setEditingTemplate(null); setShowTemplateForm(true); }}
              className="btn btn-primary flex items-center gap-2">
              <Plus size={18} /> Tambah
            </button>
          </div>
          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-gray-500">{departments.find(d => d.id === t.department_id)?.name} • {t.type}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingTemplate(t); setShowTemplateForm(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 text-red-600 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab (Admin only) */}
      {activeTab === 'users' && isAdmin && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">User Management 🔐</h2>
            <button onClick={() => { setEditingUser(null); setShowUserForm(true); }}
              className="btn btn-primary flex items-center gap-2">
              <Plus size={18} /> Tambah User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Departemen</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{departments.find(d => d.id === u.department_id)?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingUser(u); setShowUserForm(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Tab (Admin only) */}
      {activeTab === 'kpi' && isAdmin && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">KPI per Departemen 🎯</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Atur target KPI untuk setiap departemen. Target ini akan ditampilkan di Dashboard.
          </p>
          <div className="grid gap-4">
            {departments.map(dept => {
              const kpi = kpiSettings.find(k => k.department_id === dept.id);
              const config = kpi?.kpi_config ? (typeof kpi.kpi_config === 'string' ? JSON.parse(kpi.kpi_config) : kpi.kpi_config) : {};
              
              // Determine what to show based on department
              const getKpiDisplay = () => {
                switch(dept.id) {
                  case 1: // Crew Store
                    return config.target_sales ? `Target Sales: Rp ${config.target_sales?.toLocaleString()}` : 'Belum diatur';
                  case 2: // Warehouse
                    return config.max_wrong_orders ? `Maks Salah Pesanan: ${config.max_wrong_orders}/bulan` : 'Belum diatur';
                  case 3: // Host Live
                    return config.target_hours ? `Target Jam: ${config.target_hours} jam/bulan` : 'Belum diatur';
                  case 4: // Content Creator
                    return config.target_posts ? `Target Post: ${config.target_posts} post/bulan` : 'Belum diatur';
                  default:
                    return 'Belum diatur';
                }
              };

              const getKpiBadgeColor = () => {
                switch(dept.id) {
                  case 1: return 'bg-green-100 text-green-700';
                  case 2: return 'bg-blue-100 text-blue-700';
                  case 3: return 'bg-red-100 text-red-700';
                  case 4: return 'bg-pink-100 text-pink-700';
                  default: return 'bg-gray-100 text-gray-700';
                }
              };

              return (
                <div key={dept.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="text-blue-500" />
                      <div>
                        <p className="font-bold">{dept.name}</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${getKpiBadgeColor()}`}>
                          {getKpiDisplay()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => { setEditingKpi({ department_id: dept.id, ...config }); setShowKpiForm(true); }}
                      className="btn btn-secondary text-sm">
                      <Edit2 size={16} className="mr-1" /> Edit KPI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Form Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingStaff ? '✏️ Edit Karyawan' : '➕ Tambah Karyawan'}</h3>
              <button onClick={() => { setShowStaffForm(false); setEditingStaff(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nama Lengkap *</label>
                  <input name="name" defaultValue={editingStaff?.name} required className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label">Email</label>
                  <input name="email" type="email" defaultValue={editingStaff?.email} className="input" />
                </div>
                <div>
                  <label className="label">Departemen</label>
                  <select name="department_id" defaultValue={editingStaff?.department_id || ''} className="input">
                    <option value="">Pilih Departemen</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Posisi</label>
                  <input name="position" defaultValue={editingStaff?.position} className="input" />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input name="role" defaultValue={editingStaff?.role || 'Staff'} className="input" />
                </div>
                <div>
                  <label className="label">Tanggal Bergabung</label>
                  <input name="join_date" type="date" defaultValue={editingStaff?.join_date} className="input" />
                </div>
                <div>
                  <label className="label">No HP</label>
                  <input name="phone" defaultValue={editingStaff?.phone} className="input" />
                </div>
                <div>
                  <label className="label">Kota</label>
                  <input name="city" defaultValue={editingStaff?.city} className="input" />
                </div>
                <div>
                  <label className="label">Nama Bank</label>
                  <input name="bank_name" defaultValue={editingStaff?.bank_name} className="input" />
                </div>
                <div>
                  <label className="label">No Rekening</label>
                  <input name="bank_account" defaultValue={editingStaff?.bank_account} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="active" defaultChecked={editingStaff?.active !== 0} className="rounded" />
                    <span>Status Aktif</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Simpan 💾</button>
                <button type="button" onClick={() => { setShowStaffForm(false); setEditingStaff(null); }} className="btn btn-secondary flex-1">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingTemplate ? '✏️ Edit Template' : '➕ Tambah Template'}</h3>
              <button onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div>
                <label className="label">Nama Template *</label>
                <input name="name" defaultValue={editingTemplate?.name} required className="input" />
              </div>
              <div>
                <label className="label">Departemen *</label>
                <select name="department_id" defaultValue={editingTemplate?.department_id} required className="input">
                  <option value="">Pilih Departemen</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipe</label>
                <select name="type" defaultValue={editingTemplate?.type || 'daily'} className="input">
                  <option value="daily">Daily</option>
                  <option value="opening">Opening</option>
                  <option value="closing">Closing</option>
                </select>
              </div>
              <div>
                <label className="label">Items (1 per baris, tambah * untuk required)</label>
                <textarea name="items" rows="6" className="input"
                  defaultValue={editingTemplate?.items ? (Array.isArray(editingTemplate.items) ? editingTemplate.items : []).map(i => i.text + (i.required ? '*' : '')).join('\n') : ''}
                  placeholder={"Contoh:\nCek stok*\nBersihkan area\nUpdate data*"} />
              </div>
              {/* Tap Status Toggle - Only for Crewstore (dept 1) */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <input 
                  type="checkbox" 
                  name="tap_enabled" 
                  id="tap_enabled"
                  defaultChecked={editingTemplate?.tap_enabled !== false}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label htmlFor="tap_enabled" className="text-sm text-gray-700">
                  Tampilkan field <strong>Status Keran</strong> di checklist ini
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Simpan 💾</button>
                <button type="button" onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }} className="btn btn-secondary flex-1">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingUser ? '✏️ Edit User' : '➕ Tambah User'}</h3>
              <button onClick={() => { setShowUserForm(false); setEditingUser(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="label">Username *</label>
                <input name="username" defaultValue={editingUser?.username} required className="input" />
              </div>
              <div>
                <label className="label">Nama Lengkap *</label>
                <input name="name" defaultValue={editingUser?.name} required className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" defaultValue={editingUser?.email} className="input" />
              </div>
              <div>
                <label className="label">{editingUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
                <input name="password" type="password" className="input" {...(!editingUser && { required: true })} />
              </div>
              <div>
                <label className="label">Role</label>
                <select name="role" defaultValue={editingUser?.role || 'staff'} className="input">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Departemen</label>
                <select name="department_id" defaultValue={editingUser?.department_id || ''} className="input">
                  <option value="">Tidak ada</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Simpan 💾</button>
                <button type="button" onClick={() => { setShowUserForm(false); setEditingUser(null); }} className="btn btn-secondary flex-1">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Form Modal */}
      {showKpiForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🎯 Edit KPI - {departments.find(d => d.id === editingKpi?.department_id)?.name}</h3>
              <button onClick={() => { setShowKpiForm(false); setEditingKpi(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleKpiSubmit} className="space-y-4">
              <input type="hidden" name="department_id" value={editingKpi?.department_id} />
              
              {/* Host Live (dept 3) - Target Jam */}
              {editingKpi?.department_id === 3 && (
                <div>
                  <label className="label">🎬 Target Jam Tayang (per bulan)</label>
                  <input name="target_hours" type="number" step="0.5" defaultValue={editingKpi?.target_hours || 100} className="input" placeholder="100" />
                  <p className="text-xs text-gray-500 mt-1">Total jam tayang yang harus dicapai oleh semua host</p>
                </div>
              )}

              {/* Content Creator (dept 4) - Target Post */}
              {editingKpi?.department_id === 4 && (
                <div>
                  <label className="label">📸 Target Post (per bulan)</label>
                  <input name="target_posts" type="number" defaultValue={editingKpi?.target_posts || 30} className="input" placeholder="30" />
                  <p className="text-xs text-gray-500 mt-1">Jumlah konten yang harus dibuat</p>
                </div>
              )}

              {/* Warehouse (dept 2) - Max Wrong Orders */}
              {editingKpi?.department_id === 2 && (
                <div>
                  <label className="label">⚠️ Maks Salah Pesanan (per bulan)</label>
                  <input name="max_wrong_orders" type="number" defaultValue={editingKpi?.max_wrong_orders || 5} className="input" placeholder="5" />
                  <p className="text-xs text-gray-500 mt-1">Batas maksimal kesalahan pesanan yang diperbolehkan</p>
                </div>
              )}

              {/* Crew Store (dept 1) - Target Sales */}
              {editingKpi?.department_id === 1 && (
                <div>
                  <label className="label">💰 Target Sales (Rp per bulan)</label>
                  <input name="target_sales" type="number" defaultValue={editingKpi?.target_sales || 0} className="input" placeholder="10000000" />
                  <p className="text-xs text-gray-500 mt-1">Target penjualan bulanan</p>
                </div>
              )}

              <div>
                <label className="label">📝 Deskripsi (opsional)</label>
                <textarea name="description" defaultValue={editingKpi?.description} className="input" rows="2" placeholder="Catatan tambahan tentang KPI ini..." />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Simpan 💾</button>
                <button type="button" onClick={() => { setShowKpiForm(false); setEditingKpi(null); }} className="btn btn-secondary flex-1">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
