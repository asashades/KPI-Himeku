import { useState, useEffect } from 'react';
import { Package, CheckCircle, Clock, Truck, Plus, TrendingUp, Trash2, Sparkles, X, AlertTriangle } from 'lucide-react';

const encourageMessages = [
  "Warehouse vibes on point! You're literally the best! ✨",
  "Packing goals unlocked! Keep slaying bestie! 🔥",
  "Main character energy in every shipment! 💅",
  "No cap, kiriman hari ini bussin! 🚀",
  "Era warehouse kamu lagi peak banget fr fr! 👑",
  "Living rent-free in the leaderboard! 😌",
  "Warehouse staff of the month material tbh! 🏆",
  "Your shipping game is immaculate rn bestie! 📦",
  "Literally ate and left no crumbs! 🎯",
  "Slay queen/king of warehouse! 💖"
];

const getRandomEncourage = () => encourageMessages[Math.floor(Math.random() * encourageMessages.length)];

// Format ISO date to Indonesian locale
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Get just the date part from ISO string for comparison
const getDateOnly = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

export default function Warehouse() {
  const [checklists, setChecklists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [encourageMsg, setEncourageMsg] = useState(getRandomEncourage());
  const [reportForm, setReportForm] = useState({ spx: '', jnt: '', pending: '', restock: '' });
  const [wrongOrders, setWrongOrders] = useState([]);
  const [showWrongOrderForm, setShowWrongOrderForm] = useState(false);
  const [wrongOrderForm, setWrongOrderForm] = useState({ order_id: '', description: '', type: 'wrong_item', status: 'pending' });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [checklistRes, templatesRes, reportsRes, wrongOrdersRes] = await Promise.all([
        fetch(`/api/warehouse/checklists?date=${today}`, { headers }),
        fetch('/api/templates?department_id=2', { headers }),
        fetch('/api/warehouse/daily-reports', { headers }),
        fetch('/api/warehouse/wrong-orders', { headers })
      ]);
      setChecklists(await checklistRes.json());
      setTemplates(await templatesRes.json());
      const reps = await reportsRes.json();
      setDailyReports(Array.isArray(reps) ? reps : []);
      const wrongOrd = await wrongOrdersRes.json();
      setWrongOrders(Array.isArray(wrongOrd) ? wrongOrd : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = async (checklistId, itemId, checked) => {
    try {
      const token = localStorage.getItem('token');
      const checklist = checklists.find(c => c.id === checklistId);
      const items = checklist.items.map(item => item.id === itemId ? { ...item, checked } : item);
      await fetch(`/api/warehouse/checklists/${checklistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items })
      });
      setChecklists(checklists.map(c => c.id === checklistId ? { ...c, items } : c));
      setEncourageMsg(getRandomEncourage());
    } catch (error) { console.error('Error:', error); }
  };

  const handleCreateChecklist = async (templateId) => {
    try {
      const token = localStorage.getItem('token');
      // Find template to get items - items already parsed by backend
      const template = templates.find(t => t.id === templateId);
      const templateItems = Array.isArray(template?.items) ? template.items : [];
      const items = templateItems.map(item => ({ ...item, checked: false }));
      
      const res = await fetch('/api/warehouse/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ template_id: templateId, date: today, items })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteChecklist = async (id) => {
    if (!confirm('Hapus checklist ini bestie? 🤔')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/warehouse/checklists/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleSubmitDailyReport = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/warehouse/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: today,
          spx: parseInt(reportForm.spx) || 0,
          jnt: parseInt(reportForm.jnt) || 0,
          total_kiriman: (parseInt(reportForm.spx) || 0) + (parseInt(reportForm.jnt) || 0),
          pending: reportForm.pending,
          restock: reportForm.restock
        })
      });
      if (res.ok) { setShowDailyReport(false); setReportForm({ spx: '', jnt: '', pending: '', restock: '' }); setEncourageMsg(getRandomEncourage()); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteReport = async (id) => {
    if (!confirm('Hapus laporan ini? 🙈')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/warehouse/daily-reports/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleSubmitWrongOrder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/warehouse/wrong-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: today,
          order_id: wrongOrderForm.order_id,
          description: wrongOrderForm.description,
          type: wrongOrderForm.type,
          status: 'pending'
        })
      });
      if (res.ok) { 
        setShowWrongOrderForm(false); 
        setWrongOrderForm({ order_id: '', description: '', type: 'wrong_item', status: 'pending' }); 
        setEncourageMsg(getRandomEncourage()); 
        fetchData(); 
      }
    } catch (error) { console.error('Error:', error); }
  };

  const handleResolveWrongOrder = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/warehouse/wrong-orders/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'resolved' })
      });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteWrongOrder = async (id) => {
    if (!confirm('Hapus laporan salah pesanan ini? 🙈')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/warehouse/wrong-orders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const todayReport = dailyReports.find(r => getDateOnly(r.date) === today);
  const todayWrongOrders = wrongOrders.filter(w => getDateOnly(w.date) === today);
  const monthWrongOrders = wrongOrders.filter(w => getDateOnly(w.date)?.startsWith(new Date().toISOString().slice(0, 7)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500">Loading warehouse data... 📦</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-500" />
            Warehouse
          </h1>
          <p className="text-gray-600 mt-1">Daily checklist & laporan warehouse - Keep it moving! 🚀</p>
        </div>
        <button onClick={() => setShowDailyReport(true)} className="btn bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white flex items-center gap-2">
          <TrendingUp size={20} /> Laporan Hari Ini
        </button>
        <button onClick={() => setShowWrongOrderForm(true)} className="btn bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white flex items-center gap-2">
          <AlertTriangle size={20} /> Lapor Salah Pesanan
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <p className="font-medium text-lg">{encourageMsg}</p>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl"><Truck className="text-orange-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">SPX</p>
              <p className="text-2xl font-bold text-gray-800">{todayReport?.spx || 0}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl"><Truck className="text-red-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">J&T</p>
              <p className="text-2xl font-bold text-gray-800">{todayReport?.jnt || 0}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl"><Package className="text-green-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{todayReport?.total_kiriman || 0}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl"><CheckCircle className="text-purple-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Checklist</p>
              <p className="text-2xl font-bold text-gray-800">{checklists.filter(c => c.items.every(i => i.checked)).length}/{checklists.length}</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-xl"><AlertTriangle className="text-yellow-600" size={24} /></div>
            <div>
              <p className="text-sm text-gray-600">Salah Pesanan</p>
              <p className="text-2xl font-bold text-red-600">{monthWrongOrders.length}</p>
              <p className="text-xs text-gray-500">bulan ini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Checklist */}
      {templates.length > 0 && (
        <div className="card bg-gradient-to-r from-blue-50 to-cyan-50">
          <h3 className="font-bold text-gray-800 mb-3">Buat Checklist Baru 📋</h3>
          <div className="flex flex-wrap gap-2">
            {templates.filter(t => t.active).map(t => (
              <button key={t.id} onClick={() => handleCreateChecklist(t.id)} className="btn btn-secondary text-sm">
                <Plus size={16} className="mr-1" /> {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {checklists.map(checklist => {
          const completed = checklist.items.filter(i => i.checked).length;
          const total = checklist.items.length;
          const progress = total > 0 ? (completed / total) * 100 : 0;
          return (
            <div key={checklist.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">{checklist.template_name}</h3>
                  <p className="text-sm text-gray-600">{completed}/{total} selesai</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>{progress.toFixed(0)}%</span>
                  <button onClick={() => handleDeleteChecklist(checklist.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
              </div>
              <div className="space-y-2">
                {checklist.items.map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input type="checkbox" checked={item.checked} onChange={(e) => handleItemToggle(checklist.id, item.id, e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                    <span className={`flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                    {item.required && <span className="text-red-500 text-xs">*</span>}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {checklists.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Belum ada checklist hari ini!</p>
          <p className="text-sm">Buat checklist dari template di atas 📋</p>
        </div>
      )}

      {/* Daily Reports History */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="text-blue-500" /> History Laporan Harian
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">SPX</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">J&T</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Total</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Pending</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dailyReports.slice(0, 10).map(report => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(report.date)}</td>
                  <td className="px-4 py-3 font-bold text-orange-600">{report.spx}</td>
                  <td className="px-4 py-3 font-bold text-red-600">{report.jnt}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{report.total_kiriman}</td>
                  <td className="px-4 py-3 text-gray-600">{report.pending || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dailyReports.length === 0 && <div className="text-center py-8 text-gray-500">Belum ada laporan</div>}
        </div>
      </div>

      {/* Wrong Orders History */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" /> Laporan Salah Pesanan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Jenis</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Keterangan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wrongOrders.slice(0, 20).map(wo => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(wo.date)}</td>
                  <td className="px-4 py-3 font-mono text-sm">{wo.order_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      wo.type === 'wrong_item' ? 'bg-red-100 text-red-700' :
                      wo.type === 'wrong_address' ? 'bg-orange-100 text-orange-700' :
                      wo.type === 'missing_item' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {wo.type === 'wrong_item' ? 'Barang Salah' :
                       wo.type === 'wrong_address' ? 'Alamat Salah' :
                       wo.type === 'missing_item' ? 'Barang Kurang' : wo.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{wo.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      wo.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      wo.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {wo.status === 'pending' ? '⏳ Pending' : wo.status === 'resolved' ? '✓ Selesai' : wo.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {wo.status === 'pending' && (
                        <button onClick={() => handleResolveWrongOrder(wo.id)} className="p-2 text-green-500 hover:bg-green-50 rounded" title="Tandai Selesai">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteWrongOrder(wo.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {wrongOrders.length === 0 && <div className="text-center py-8 text-gray-500">Belum ada laporan salah pesanan 🎉</div>}
        </div>
      </div>

      {/* Daily Report Modal */}
      {showDailyReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">📊 Laporan Hari Ini</h3>
              <button onClick={() => setShowDailyReport(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitDailyReport} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">📦 SPX</label>
                  <input type="number" value={reportForm.spx} onChange={(e) => setReportForm({ ...reportForm, spx: e.target.value })} className="input" placeholder="0" />
                </div>
                <div>
                  <label className="label">📦 J&T</label>
                  <input type="number" value={reportForm.jnt} onChange={(e) => setReportForm({ ...reportForm, jnt: e.target.value })} className="input" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="label">⏳ Pending</label>
                <textarea value={reportForm.pending} onChange={(e) => setReportForm({ ...reportForm, pending: e.target.value })} className="input" rows="2" placeholder="List pending orders..." />
              </div>
              <div>
                <label className="label">📋 Restock Needed</label>
                <textarea value={reportForm.restock} onChange={(e) => setReportForm({ ...reportForm, restock: e.target.value })} className="input" rows="2" placeholder="Items yang perlu restock..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Submit! 🚀</button>
                <button type="button" onClick={() => setShowDailyReport(false)} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wrong Order Modal */}
      {showWrongOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">⚠️ Lapor Salah Pesanan</h3>
              <button onClick={() => setShowWrongOrderForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitWrongOrder} className="space-y-4">
              <div>
                <label className="label">🔢 Order ID / No Resi</label>
                <input 
                  type="text" 
                  value={wrongOrderForm.order_id} 
                  onChange={(e) => setWrongOrderForm({ ...wrongOrderForm, order_id: e.target.value })} 
                  className="input" 
                  placeholder="Masukkan order ID atau nomor resi"
                  required 
                />
              </div>
              <div>
                <label className="label">📋 Jenis Kesalahan</label>
                <select 
                  value={wrongOrderForm.type} 
                  onChange={(e) => setWrongOrderForm({ ...wrongOrderForm, type: e.target.value })} 
                  className="input"
                >
                  <option value="wrong_item">Barang Salah</option>
                  <option value="wrong_address">Alamat Salah</option>
                  <option value="missing_item">Barang Kurang</option>
                  <option value="damaged">Barang Rusak</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="label">📝 Keterangan</label>
                <textarea 
                  value={wrongOrderForm.description} 
                  onChange={(e) => setWrongOrderForm({ ...wrongOrderForm, description: e.target.value })} 
                  className="input" 
                  rows="3" 
                  placeholder="Jelaskan detail kesalahan..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white flex-1">Laporkan! ⚠️</button>
                <button type="button" onClick={() => setShowWrongOrderForm(false)} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
