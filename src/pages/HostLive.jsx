import { useState, useEffect } from 'react';
import { Plus, Trophy, Clock, X, Sparkles, Search, Calendar, User } from 'lucide-react';

const encourageMessages = [
  "Host vibes on point! You're literally iconic! ✨",
  "Streaming goals unlocked! Keep slaying bestie! 🔥",
  "Main character energy in every stream! 💅",
  "No cap, your live hours are bussin! 🚀",
  "Era streaming kamu lagi peak banget fr fr! 👑",
  "Living rent-free in the leaderboard! 😌",
  "Host of the month material tbh! 🏆",
  "The algorithm loves you rn bestie! 📈",
  "Literally ate and left no crumbs! 🎯",
  "Slay queen/king of live streaming! 💖"
];

const getRandomEncourage = () => encourageMessages[Math.floor(Math.random() * encourageMessages.length)];

export default function HostLive({ user }) {
  const [hosts, setHosts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddHost, setShowAddHost] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  const [showAddSession, setShowAddSession] = useState(false);
  const [showEditHost, setShowEditHost] = useState(false);
  const [selectedHost, setSelectedHost] = useState(null);
  const [editingHost, setEditingHost] = useState(null);
  const [encourageMsg, setEncourageMsg] = useState(getRandomEncourage());
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [rekapLive, setRekapLive] = useState([]);
  const [rekapSummary, setRekapSummary] = useState([]);
  const [rekapLoading, setRekapLoading] = useState(false);
  const [rekapFilter, setRekapFilter] = useState({
    startDate: '',
    endDate: '',
    email: ''
  });

  useEffect(() => { fetchData(); }, []);

  // Fetch rekap live when tab changes to sessions
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchRekapLive();
    }
  }, [activeTab]);

  const fetchRekapLive = async () => {
    setRekapLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = '/api/hostlive/rekap-live?';
      if (rekapFilter.startDate) url += `startDate=${rekapFilter.startDate}&`;
      if (rekapFilter.endDate) url += `endDate=${rekapFilter.endDate}&`;
      if (rekapFilter.email) url += `email=${rekapFilter.email}&`;
      
      const [rekapRes, summaryRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/hostlive/rekap-summary', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const rekapData = await rekapRes.json();
      const summaryData = await summaryRes.json();
      
      setRekapLive(Array.isArray(rekapData) ? rekapData : []);
      setRekapSummary(Array.isArray(summaryData) ? summaryData : []);
    } catch (error) {
      console.error('Error fetching rekap:', error);
    } finally {
      setRekapLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [hostsRes, staffRes] = await Promise.all([
        fetch('/api/hostlive/hosts', { headers }),
        fetch('/api/staff?department_id=3', { headers })
      ]);
      
      const hostsData = await hostsRes.json();
      const staffData = await staffRes.json();
      
      setHosts(Array.isArray(hostsData) ? hostsData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      console.error('Error:', error);
      setHosts([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHost = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const staffId = formData.get('staff_id');
    const targetHours = formData.get('monthly_target_hours');
    
    if (!staffId) {
      alert('Pilih staff terlebih dahulu!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/hostlive/hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          staff_id: parseInt(staffId),
          monthly_target_hours: parseFloat(targetHours) || 100
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowAddHost(false);
        setEncourageMsg(getRandomEncourage());
        fetchData();
        alert('Host berhasil ditambahkan! 🎉');
      } else {
        alert('Gagal menambahkan host: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal menambahkan host: ' + error.message);
    }
  };

  const handleEditHost = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/hostlive/hosts/${editingHost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monthly_target_hours: parseFloat(formData.get('monthly_target_hours')) })
      });
      if (res.ok) { setShowEditHost(false); setEditingHost(null); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const handleDeleteHost = async (id) => {
    if (!confirm('Fr fr mau hapus host ini? 🙈')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/hostlive/hosts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/hostlive/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          host_id: selectedHost?.id,
          date: formData.get('date'),
          start_time: formData.get('start_time'),
          end_time: formData.get('end_time'),
          notes: formData.get('notes')
        })
      });
      if (res.ok) { setShowAddSession(false); setSelectedHost(null); setEncourageMsg(getRandomEncourage()); fetchData(); }
    } catch (error) { console.error('Error:', error); }
  };

  const formatCurrency = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-gray-500">Loading data host... ✨</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Host Live
          </h1>
          <p className="text-gray-600 mt-1">Tracking jam tayang host - Let's go viral! 🚀</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddHost(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={20} /> Tambah Host
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <p className="font-medium text-lg">{encourageMsg}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        <button onClick={() => setActiveTab('leaderboard')} className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'leaderboard' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
          <Trophy size={20} /> Leaderboard
        </button>
        <button onClick={() => setActiveTab('sessions')} className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'sessions' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
          <Clock size={20} /> Sesi Live
        </button>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-yellow-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Leaderboard Bulan Ini 🏆</h2>
          </div>
          <div className="space-y-3">
            {hosts.map((host, index) => {
              const progress = host.monthly_target_hours > 0 ? ((host.current_month_hours || 0) / host.monthly_target_hours) * 100 : 0;
              return (
                <div key={host.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`text-2xl font-bold w-8 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    {host.photo_url ? (
                      <img src={host.photo_url} alt={host.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">{host.name?.charAt(0)}</div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{host.name}</h3>
                      <p className="text-sm text-gray-600">{(host.current_month_hours || 0).toFixed(1)} / {host.monthly_target_hours} jam</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{progress.toFixed(1)}%</div>
                      {isAdmin && (
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => { setSelectedHost(host); setShowAddSession(true); }} className="text-xs text-blue-600 hover:underline">+ Jam</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => { setEditingHost(host); setShowEditHost(true); }} className="text-xs text-green-600 hover:underline">Edit</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDeleteHost(host.id)} className="text-xs text-red-600 hover:underline">Hapus</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            {hosts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Belum ada host nih bestie! 😅</p>
                <p className="text-sm">Klik "Tambah Host" untuk mulai tracking!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-blue-500" size={24} />
              <h3 className="text-lg font-bold text-gray-800">Filter Sesi Live</h3>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="label text-sm">Tanggal Mulai</label>
                <input
                  type="date"
                  value={rekapFilter.startDate}
                  onChange={(e) => setRekapFilter({ ...rekapFilter, startDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label text-sm">Tanggal Selesai</label>
                <input
                  type="date"
                  value={rekapFilter.endDate}
                  onChange={(e) => setRekapFilter({ ...rekapFilter, endDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label text-sm">Email Host</label>
                <input
                  type="text"
                  value={rekapFilter.email}
                  onChange={(e) => setRekapFilter({ ...rekapFilter, email: e.target.value })}
                  className="input"
                  placeholder="Cari email..."
                />
              </div>
              <button onClick={fetchRekapLive} className="btn btn-primary flex items-center gap-2">
                <Search size={18} /> Cari
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {rekapSummary.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rekapSummary.slice(0, 6).map((host, idx) => (
                <div key={idx} className="card bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {host.NamaHost?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{host.NamaHost || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{host.EmailHost}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-lg font-bold text-blue-600">{host.totalSessions}</p>
                      <p className="text-xs text-gray-500">Sesi</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-lg font-bold text-purple-600">{(host.totalHours || 0).toFixed(1)}</p>
                      <p className="text-xs text-gray-500">Jam</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(host.totalGaji || 0)}</p>
                      <p className="text-xs text-gray-500">Gaji</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={20} className="text-red-500" />
                Detail Sesi Live (dari Spreadsheet)
              </h3>
              <span className="text-sm text-gray-500">{rekapLive.length} data</span>
            </div>
            
            {rekapLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 mt-2">Memuat dari spreadsheet...</p>
              </div>
            ) : rekapLive.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Nama Host</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Tanggal</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Jam</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Durasi</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Gaji</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-700">Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rekapLive.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <span className="font-medium">{row.NamaHost}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">{row.TanggalLive}</td>
                        <td className="px-3 py-2">{row.JamMulai} - {row.JamSelesai}</td>
                        <td className="px-3 py-2 font-bold text-blue-600">{row.DurasiJam} jam</td>
                        <td className="px-3 py-2 font-medium text-green-600">{formatCurrency(row.Gaji || 0)}</td>
                        <td className="px-3 py-2">
                          {row.FotoBuktiURL ? (
                            <a href={row.FotoBuktiURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                              Lihat
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Tidak ada data sesi live</p>
                <p className="text-sm">Data diambil otomatis dari Google Spreadsheet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">✨ Tambah Host Baru</h3>
              <button onClick={() => setShowAddHost(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddHost} className="space-y-4">
              <div>
                <label className="label">Pilih Staff</label>
                <select name="staff_id" className="input" required>
                  <option value="">-- Pilih Staff --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Target Jam Bulanan</label>
                <input type="number" name="monthly_target_hours" className="input" placeholder="100" step="0.1" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Let's Go! 🚀</button>
                <button type="button" onClick={() => setShowAddHost(false)} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditHost && editingHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">✏️ Edit Target - {editingHost.name}</h3>
              <button onClick={() => { setShowEditHost(false); setEditingHost(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditHost} className="space-y-4">
              <div>
                <label className="label">Target Jam Bulanan</label>
                <input type="number" name="monthly_target_hours" className="input" defaultValue={editingHost.monthly_target_hours} step="0.1" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Update! ✨</button>
                <button type="button" onClick={() => { setShowEditHost(false); setEditingHost(null); }} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddSession && selectedHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🎬 Input Jam Live - {selectedHost.name}</h3>
              <button onClick={() => { setShowAddSession(false); setSelectedHost(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="label">📅 Tanggal</label>
                <input type="date" name="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">⏰ Jam Mulai</label>
                  <input type="time" name="start_time" className="input" required />
                </div>
                <div>
                  <label className="label">⏰ Jam Selesai</label>
                  <input type="time" name="end_time" className="input" required />
                </div>
              </div>
              <div>
                <label className="label">📝 Catatan (opsional)</label>
                <textarea name="notes" className="input" rows="2" placeholder="Catatan..."></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">Simpan! 🔥</button>
                <button type="button" onClick={() => { setShowAddSession(false); setSelectedHost(null); }} className="btn btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
