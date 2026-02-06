import { useState, useEffect } from 'react';
import { Sun, Moon, Plus, CheckCircle, PlusCircle, X, DollarSign, Droplet, Edit2, History, Calendar, Search, ChevronDown, ChevronUp, User, Sparkles, Package } from 'lucide-react';

const encourageMessages = [
  "Crewstore vibes lagi on fire! 🔥",
  "Keep slaying bestie, toko makin rame! ✨",
  "Opening checklist? Ate and left no crumbs! 💅",
  "Main character energy at the store! 👑",
  "Closing smooth? That's the spirit! 🌙",
  "Sales goals unlocked, ur literally iconic! 💰",
  "No cap, tim crewstore emang the best! 🏆",
  "Slay queen/king of retail! 🛍️",
  "Era produktif kamu lagi peak fr fr! 📈",
  "Living rent-free in the leaderboard! 😌"
];

const getRandomEncourage = () => encourageMessages[Math.floor(Math.random() * encourageMessages.length)];

export default function Crewstore() {
  const [todayStatus, setTodayStatus] = useState(null);
  const [templates, setTemplates] = useState({ opening: null, closing: null });
  const [loading, setLoading] = useState(true);
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [showClosingForm, setShowClosingForm] = useState(false);
  const [openingAdHocItems, setOpeningAdHocItems] = useState([]);
  const [closingAdHocItems, setClosingAdHocItems] = useState([]);
  const [newAdHocItem, setNewAdHocItem] = useState('');
  const [editingOpening, setEditingOpening] = useState(false);
  const [editingClosing, setEditingClosing] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [encourageMsg] = useState(getRandomEncourage());
  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [expandedHistoryDate, setExpandedHistoryDate] = useState(null);
  const [expandedHistoryType, setExpandedHistoryType] = useState(null);
  // Restock state
  const [restockItems, setRestockItems] = useState([]);
  const [newRestockItem, setNewRestockItem] = useState('');
  const [showAddRestock, setShowAddRestock] = useState(false);

  useEffect(() => {
    fetchData();
    fetchRestockItems();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (e) { /* ignore */ }
    }
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setHistoryStartDate(firstDay.toISOString().split('T')[0]);
    setHistoryEndDate(now.toISOString().split('T')[0]);
  }, []);

  const fetchRestockItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/warehouse/restock?source=crewstore', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRestockItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching restock:', error);
    }
  };

  const handleAddRestock = async () => {
    if (!newRestockItem.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/warehouse/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newRestockItem, source: 'crewstore' })
      });
      if (res.ok) {
        setNewRestockItem('');
        fetchRestockItems();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCompleteRestock = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/warehouse/restock/${id}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRestockItems();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/crewstore/history?startDate=${historyStartDate}&endDate=${historyEndDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory && historyStartDate && historyEndDate) {
      fetchHistory();
    }
  }, [showHistory, historyStartDate, historyEndDate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [todayRes, templatesRes, staffRes] = await Promise.all([
        fetch('/api/crewstore/today', { headers }),
        fetch('/api/templates?department_id=1', { headers }),
        fetch('/api/staff', { headers })
      ]);
      const todayData = await todayRes.json();
      const templatesData = await templatesRes.json();
      const staffData = await staffRes.json();
      setTodayStatus(todayData);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setTemplates({
        opening: templatesData.find(t => t.type === 'opening'),
        closing: templatesData.find(t => t.type === 'closing')
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOpeningAdHocItem = () => {
    if (newAdHocItem.trim()) {
      setOpeningAdHocItems([...openingAdHocItems, { text: newAdHocItem.trim() }]);
      setNewAdHocItem('');
    }
  };

  const removeOpeningAdHocItem = (index) => {
    setOpeningAdHocItems(openingAdHocItems.filter((_, i) => i !== index));
  };

  const addClosingAdHocItem = () => {
    if (newAdHocItem.trim()) {
      setClosingAdHocItems([...closingAdHocItems, { text: newAdHocItem.trim() }]);
      setNewAdHocItem('');
    }
  };

  const removeClosingAdHocItem = (index) => {
    setClosingAdHocItems(closingAdHocItems.filter((_, i) => i !== index));
  };

  const canEditOpening = () => {
    if (!currentUser || !todayStatus?.opening) return false;
    return currentUser.role === 'admin' || todayStatus.opening.completed_by === currentUser.id;
  };

  const canEditClosing = () => {
    if (!currentUser || !todayStatus?.closing) return false;
    return currentUser.role === 'admin' || todayStatus.closing.completed_by === currentUser.id;
  };

  const handleEditOpening = () => {
    if (todayStatus?.opening) {
      const adHocItems = todayStatus.opening.items.filter(i => i.isAdHoc).map(i => ({ text: i.text }));
      setOpeningAdHocItems(adHocItems);
      setEditingOpening(true);
      setShowOpeningForm(true);
    }
  };

  const handleEditClosing = () => {
    if (todayStatus?.closing) {
      const adHocItems = todayStatus.closing.items.filter(i => i.isAdHoc).map(i => ({ text: i.text }));
      setClosingAdHocItems(adHocItems);
      setEditingClosing(true);
      setShowClosingForm(true);
    }
  };

  const handleOpeningSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const templateItems = templates.opening.items.map(item => ({
      ...item,
      checked: formData.get(`item_${item.id}`) === 'on',
      note: formData.get(`note_${item.id}`) || ''
    }));
    const adHocItemsData = openingAdHocItems.map((item, idx) => ({
      id: `adhoc_${idx}`,
      text: item.text,
      checked: formData.get(`adhoc_${idx}`) === 'on',
      note: formData.get(`adhoc_note_${idx}`) || '',
      isAdHoc: true
    }));
    const items = [...templateItems, ...adHocItemsData];
    try {
      const token = localStorage.getItem('token');
      const url = editingOpening ? `/api/crewstore/opening/${todayStatus.opening.id}` : '/api/crewstore/opening';
      const method = editingOpening ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: formData.get('date'),
          open_time: formData.get('open_time'),
          items,
          tap_status: formData.get('tap_status'),
          tap_notes: formData.get('tap_notes')
        })
      });
      if (response.ok) {
        setShowOpeningForm(false);
        setOpeningAdHocItems([]);
        setEditingOpening(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error submitting opening:', error);
    }
  };

  const handleClosingSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const templateItems = templates.closing.items.map(item => ({
      ...item,
      checked: formData.get(`item_${item.id}`) === 'on',
      note: formData.get(`note_${item.id}`) || ''
    }));
    const adHocItemsData = closingAdHocItems.map((item, idx) => ({
      id: `adhoc_${idx}`,
      text: item.text,
      checked: formData.get(`closing_adhoc_${idx}`) === 'on',
      note: formData.get(`closing_adhoc_note_${idx}`) || '',
      isAdHoc: true
    }));
    const items = [...templateItems, ...adHocItemsData];
    try {
      const token = localStorage.getItem('token');
      const url = editingClosing ? `/api/crewstore/closing/${todayStatus.closing.id}` : '/api/crewstore/closing';
      const method = editingClosing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: formData.get('date'),
          items,
          additional_notes: formData.get('additional_notes'),
          next_shift_morning: formData.get('next_shift_morning'),
          next_shift_afternoon: formData.get('next_shift_afternoon'),
          next_shift_stock: formData.get('next_shift_stock'),
          daily_sales: parseInt(formData.get('daily_sales')) || 0
        })
      });
      if (response.ok) {
        setShowClosingForm(false);
        setClosingAdHocItems([]);
        setEditingClosing(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error submitting closing:', error);
    }
  };

  const getOpeningProgress = () => {
    if (!todayStatus?.opening?.items) return 0;
    const total = todayStatus.opening.items.length;
    const checked = todayStatus.opening.items.filter(i => i.checked).length;
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  };

  const getClosingProgress = () => {
    if (!todayStatus?.closing?.items) return 0;
    const total = todayStatus.closing.items.length;
    const checked = todayStatus.closing.items.filter(i => i.checked).length;
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  };

  // Group history by date
  const getGroupedHistory = () => {
    const grouped = {};
    history.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = { date: item.date, opening: null, closing: null };
      }
      if (item.type === 'opening') grouped[item.date].opening = item;
      if (item.type === 'closing') grouped[item.date].closing = item;
    });
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encourage Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="text-yellow-300" size={24} />
          </div>
          <div>
            <p className="text-lg font-bold">{encourageMsg}</p>
            <p className="text-sm text-green-100">Tim Crewstore selalu semangat! 💪</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Crewstore</h1>
          <p className="text-gray-600 mt-1">Checklist Opening & Closing toko</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showHistory
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          <History size={20} />
          {showHistory ? 'Sembunyikan History' : 'Lihat History'}
        </button>
      </div>

      {/* ─── History Section ─── */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
                <input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                <input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={fetchHistory} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <Search size={18} /> Cari
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-2">Memuat history...</p>
            </div>
          ) : getGroupedHistory().length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Tidak ada data checklist dalam periode ini</p>
            </div>
          ) : (
            <div className="divide-y">
              {getGroupedHistory().map((dayGroup) => (
                <div key={dayGroup.date} className="p-4">
                  {/* Date Row with Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-[180px]">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-800">{dayGroup.date}</span>
                    </div>

                    {/* Opening Button */}
                    <button
                      onClick={() => {
                        if (expandedHistoryDate === dayGroup.date && expandedHistoryType === 'opening') {
                          setExpandedHistoryDate(null); setExpandedHistoryType(null);
                        } else {
                          setExpandedHistoryDate(dayGroup.date); setExpandedHistoryType('opening');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        dayGroup.opening
                          ? (expandedHistoryDate === dayGroup.date && expandedHistoryType === 'opening')
                            ? 'bg-yellow-500 text-white'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!dayGroup.opening}
                    >
                      <Sun size={14} /> Opening
                      {dayGroup.opening && <span className="text-xs">({dayGroup.opening.checked_count}/{dayGroup.opening.total_count})</span>}
                    </button>

                    {/* Closing Button */}
                    <button
                      onClick={() => {
                        if (expandedHistoryDate === dayGroup.date && expandedHistoryType === 'closing') {
                          setExpandedHistoryDate(null); setExpandedHistoryType(null);
                        } else {
                          setExpandedHistoryDate(dayGroup.date); setExpandedHistoryType('closing');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        dayGroup.closing
                          ? (expandedHistoryDate === dayGroup.date && expandedHistoryType === 'closing')
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!dayGroup.closing}
                    >
                      <Moon size={14} /> Closing
                      {dayGroup.closing && <span className="text-xs">({dayGroup.closing.checked_count}/{dayGroup.closing.total_count})</span>}
                    </button>

                    {/* Penghasilan */}
                    {dayGroup.closing?.daily_sales > 0 && (
                      <div className="ml-auto flex items-center gap-1.5 text-green-700 font-medium text-sm">
                        <DollarSign size={14} />
                        Rp {dayGroup.closing.daily_sales.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>

                  {/* ── Expanded Opening Detail ── */}
                  {expandedHistoryDate === dayGroup.date && expandedHistoryType === 'opening' && dayGroup.opening && (
                    <div className="mt-3 bg-yellow-50 rounded-lg p-4 border border-yellow-200 animate-in">
                      <div className="flex items-center gap-3 mb-3">
                        <Sun className="text-yellow-600" size={20} />
                        <h4 className="font-bold text-gray-800">Opening</h4>
                        <span className="text-sm text-gray-500">{dayGroup.date}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-xl">✓</span>
                          <div>
                            <p className="text-xs text-gray-500">Jam Buka</p>
                            <p className="font-bold">{dayGroup.opening.open_time || '-'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{dayGroup.opening.checked_count}/{dayGroup.opening.total_count} item</p>
                          <p className="font-bold text-green-600">
                            {dayGroup.opening.total_count > 0 ? Math.round((dayGroup.opening.checked_count / dayGroup.opening.total_count) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-yellow-200 pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Checklist:</p>
                        <div className="space-y-1">
                          {dayGroup.opening.items.map((ci, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <span className={ci.checked ? 'text-green-600' : 'text-gray-400'}>{ci.checked ? '✓' : '○'}</span>
                              <span className={ci.checked ? 'text-gray-800' : 'text-gray-400'}>
                                {ci.text}
                                {ci.isAdHoc && <span className="text-xs ml-1 text-blue-500">(tambahan)</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {dayGroup.opening.tap_status && (
                        <div className="border-t border-yellow-200 pt-3 mt-3">
                          <p className="text-sm text-gray-700"><span className="font-medium">Status Keran:</span> {dayGroup.opening.tap_status}</p>
                          {dayGroup.opening.tap_notes && <p className="text-xs text-gray-600 mt-1">{dayGroup.opening.tap_notes}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Expanded Closing Detail ── */}
                  {expandedHistoryDate === dayGroup.date && expandedHistoryType === 'closing' && dayGroup.closing && (
                    <div className="mt-3 bg-purple-50 rounded-lg p-4 border border-purple-200 animate-in">
                      <div className="flex items-center gap-3 mb-3">
                        <Moon className="text-purple-600" size={20} />
                        <h4 className="font-bold text-gray-800">Closing</h4>
                        <span className="text-sm text-gray-500">{dayGroup.date}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">{dayGroup.closing.checked_count}/{dayGroup.closing.total_count} item</p>
                          <p className="font-bold text-green-600">
                            {dayGroup.closing.total_count > 0 ? Math.round((dayGroup.closing.checked_count / dayGroup.closing.total_count) * 100) : 0}%
                          </p>
                        </div>
                        {dayGroup.closing.daily_sales > 0 && (
                          <div>
                            <p className="text-xs text-gray-500">Penjualan</p>
                            <p className="font-bold text-green-600">Rp {dayGroup.closing.daily_sales.toLocaleString('id-ID')}</p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-purple-200 pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Checklist:</p>
                        <div className="space-y-1">
                          {dayGroup.closing.items.map((ci, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <span className={ci.checked ? 'text-green-600' : 'text-gray-400'}>{ci.checked ? '✓' : '○'}</span>
                              <span className={ci.checked ? 'text-gray-800' : 'text-gray-400'}>
                                {ci.text}
                                {ci.isAdHoc && <span className="text-xs ml-1 text-blue-500">(tambahan)</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {dayGroup.closing.additional_notes && (
                        <div className="border-t border-purple-200 pt-3 mt-3">
                          <p className="text-sm"><span className="font-medium">Catatan:</span> {dayGroup.closing.additional_notes}</p>
                        </div>
                      )}
                      {(dayGroup.closing.next_shift_morning || dayGroup.closing.next_shift_afternoon || dayGroup.closing.next_shift_stock) && (
                        <div className="border-t border-purple-200 pt-3 mt-3 text-sm">
                          <span className="font-medium">Jadwal Besok:</span>
                          <div className="ml-4 mt-1 space-y-1">
                            {dayGroup.closing.next_shift_morning && <p>Pagi: {dayGroup.closing.next_shift_morning}</p>}
                            {dayGroup.closing.next_shift_afternoon && <p>Siang: {dayGroup.closing.next_shift_afternoon}</p>}
                            {dayGroup.closing.next_shift_stock && <p>Stok: {dayGroup.closing.next_shift_stock}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Today's Status Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opening Card */}
        <div className={`card ${
          todayStatus?.opening_completed
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200'
            : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${todayStatus?.opening_completed ? 'bg-green-500' : 'bg-yellow-500'}`}>
                <Sun className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Opening</h2>
                <p className="text-sm text-gray-600">{todayStatus?.date}</p>
              </div>
            </div>
            <div className={`text-3xl ${todayStatus?.opening_completed ? 'text-green-600' : 'text-yellow-600'}`}>
              {todayStatus?.opening_completed ? '✓' : '⏳'}
            </div>
          </div>

          {todayStatus?.opening ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Jam Buka</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{todayStatus.opening.open_time}</span>
                  {canEditOpening() && (
                    <button onClick={handleEditOpening} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit Opening">
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-500 ${getOpeningProgress() === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${getOpeningProgress()}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{todayStatus.opening.items.filter(i => i.checked).length}/{todayStatus.opening.items.length} item</span>
                <span className={`font-bold ${getOpeningProgress() === 100 ? 'text-green-600' : 'text-yellow-600'}`}>{getOpeningProgress()}%</span>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Checklist:</p>
                <div className="space-y-1">
                  {todayStatus.opening.items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <span className={item.checked ? 'text-green-600' : 'text-gray-400'}>{item.checked ? '✓' : '○'}</span>
                      <span className={`${item.checked ? 'text-gray-800' : 'text-gray-400'} ${item.isAdHoc ? 'italic' : ''}`}>
                        {item.text}
                        {item.isAdHoc && <span className="text-xs ml-1 text-blue-500">(tambahan)</span>}
                        {item.note && <span className="text-gray-500"> ({item.note})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {todayStatus.opening.tap_status && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-700"><span className="font-medium">Status Keran:</span> {todayStatus.opening.tap_status}</p>
                  {todayStatus.opening.tap_notes && <p className="text-xs text-gray-600 mt-1">{todayStatus.opening.tap_notes}</p>}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-4">Belum ada checklist opening untuk hari ini.</p>
              <button onClick={() => setShowOpeningForm(true)} className="btn btn-success w-full flex items-center justify-center gap-2">
                <Plus size={20} /> Isi Checklist Opening
              </button>
            </div>
          )}
        </div>

        {/* Closing Card */}
        <div className={`card ${
          todayStatus?.closing_completed
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200'
            : 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${todayStatus?.closing_completed ? 'bg-green-500' : 'bg-orange-500'}`}>
                <Moon className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Closing</h2>
                <p className="text-sm text-gray-600">{todayStatus?.date}</p>
              </div>
            </div>
            <div className={`text-3xl ${todayStatus?.closing_completed ? 'text-green-600' : 'text-orange-600'}`}>
              {todayStatus?.closing_completed ? '✓' : '⏳'}
            </div>
          </div>

          {todayStatus?.closing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {todayStatus.closing.daily_sales > 0 ? (
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2 flex-1">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="text-sm text-green-700">Penjualan:</span>
                    <span className="font-bold text-green-800">Rp {todayStatus.closing.daily_sales.toLocaleString('id-ID')}</span>
                  </div>
                ) : <div></div>}
                {canEditClosing() && (
                  <button onClick={handleEditClosing} className="p-2 text-blue-600 hover:bg-blue-50 rounded ml-2" title="Edit Closing">
                    <Edit2 size={18} />
                  </button>
                )}
              </div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-500 ${getClosingProgress() === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${getClosingProgress()}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{todayStatus.closing.items.filter(i => i.checked).length}/{todayStatus.closing.items.length} item</span>
                <span className={`font-bold ${getClosingProgress() === 100 ? 'text-green-600' : 'text-orange-600'}`}>{getClosingProgress()}%</span>
              </div>
              <div className="border-b pb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Checklist:</p>
                <div className="space-y-1">
                  {todayStatus.closing.items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <span className={item.checked ? 'text-green-600' : 'text-gray-400'}>{item.checked ? '✓' : '○'}</span>
                      <span className={`${item.checked ? 'text-gray-800' : 'text-gray-400'} ${item.isAdHoc ? 'italic' : ''}`}>
                        {item.text}
                        {item.isAdHoc && <span className="text-xs ml-1 text-blue-500">(tambahan)</span>}
                        {item.note && <span className="text-gray-500"> ({item.note})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {todayStatus.closing.additional_notes && (
                <div className="border-b pb-3">
                  <p className="text-sm font-medium text-gray-700">Catatan Tambahan:</p>
                  <p className="text-sm text-gray-600 mt-1">{todayStatus.closing.additional_notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Jadwal Besok:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Pagi:</span> {todayStatus.closing.next_shift_morning || '-'}</p>
                  <p><span className="font-medium">Siang:</span> {todayStatus.closing.next_shift_afternoon || '-'}</p>
                  <p><span className="font-medium">Stok:</span> {todayStatus.closing.next_shift_stock || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-4">Belum ada checklist closing untuk hari ini.</p>
              <button onClick={() => setShowClosingForm(true)} className="btn btn-success w-full flex items-center justify-center gap-2">
                <Plus size={20} /> Isi Checklist Closing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Butuh Restock Card ─── */}
      <div className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-orange-800">Butuh Restock</h3>
          </div>
          <button
            onClick={() => setShowAddRestock(!showAddRestock)}
            className="btn bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 text-sm"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>

        {showAddRestock && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newRestockItem}
              onChange={(e) => setNewRestockItem(e.target.value)}
              placeholder="Nama barang yang perlu restock..."
              className="input flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddRestock()}
            />
            <button onClick={handleAddRestock} className="btn bg-orange-500 hover:bg-orange-600 text-white">
              <PlusCircle size={18} />
            </button>
          </div>
        )}

        {restockItems.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
            <p className="text-green-600 font-medium">Yeaay! Stok aman semua bestie! 🎉</p>
            <p className="text-sm text-gray-500">Tidak ada barang yang perlu restock</p>
          </div>
        ) : (
          <div className="space-y-2">
            {restockItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleCompleteRestock(item.id)}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-100 hover:bg-orange-50 cursor-pointer transition-colors group"
              >
                <div className="w-5 h-5 rounded border-2 border-orange-300 group-hover:border-orange-500 flex items-center justify-center">
                  <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">✓</span>
                </div>
                <span className="text-gray-800 flex-1">{item.text}</span>
                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Opening Form Modal ─── */}
      {showOpeningForm && templates.opening && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sun className="text-yellow-500" size={28} />
              Checklist Opening {editingOpening && '(Edit)'}
            </h3>
            <form onSubmit={handleOpeningSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tanggal</label>
                  <input type="date" name="date" className="input" defaultValue={todayStatus?.opening?.date || new Date().toISOString().split('T')[0]} required />
                </div>
                <div>
                  <label className="label">Jam Buka</label>
                  <input type="time" name="open_time" className="input" defaultValue={todayStatus?.opening?.open_time || ''} required />
                </div>
              </div>
              <div>
                <label className="label">Checklist Items</label>
                <div className="space-y-3 border rounded-lg p-4">
                  {templates.opening.items.map(item => {
                    const existingItem = editingOpening && todayStatus?.opening?.items?.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name={`item_${item.id}`} className="w-5 h-5 text-green-600 rounded" defaultChecked={existingItem?.checked || false} />
                          <span className="font-medium">{item.text}</span>
                          {item.required && <span className="text-red-500">*</span>}
                        </label>
                        <input type="text" name={`note_${item.id}`} placeholder="Catatan (opsional)" className="input text-sm ml-7" defaultValue={existingItem?.note || ''} />
                      </div>
                    );
                  })}
                  {openingAdHocItems.map((item, idx) => (
                    <div key={`adhoc_${idx}`} className="space-y-2 bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name={`adhoc_${idx}`} className="w-5 h-5 text-blue-600 rounded" />
                          <span className="font-medium text-blue-800">{item.text}</span>
                          <span className="text-xs text-blue-500">(tambahan)</span>
                        </label>
                        <button type="button" onClick={() => removeOpeningAdHocItem(idx)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                      </div>
                      <input type="text" name={`adhoc_note_${idx}`} placeholder="Catatan (opsional)" className="input text-sm ml-7" />
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <label className="label text-blue-600">Tambah Item Checklist</label>
                    <div className="flex gap-2">
                      <input type="text" value={newAdHocItem} onChange={(e) => setNewAdHocItem(e.target.value)} placeholder="Ketik item tambahan..." className="input flex-1" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOpeningAdHocItem(); } }} />
                      <button type="button" onClick={addOpeningAdHocItem} className="btn btn-primary flex items-center gap-1"><PlusCircle size={18} /> Tambah</button>
                    </div>
                  </div>
                </div>
              </div>
              {templates.opening.tap_enabled !== false && (
                <>
                  <div>
                    <label className="label flex items-center gap-2"><Droplet size={18} className="text-blue-500" /> Status Keran</label>
                    <select name="tap_status" className="input" defaultValue={editingOpening && todayStatus?.opening?.tap_status || ''}>
                      <option value="">-- Pilih Status --</option>
                      <option value="Nyala">Nyala</option>
                      <option value="Mati">Mati</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Catatan Keran (opsional)</label>
                    <textarea name="tap_notes" className="input" rows="2" placeholder="Catatan tambahan tentang keran..." defaultValue={editingOpening && todayStatus?.opening?.tap_notes || ''}></textarea>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-success flex-1">Simpan</button>
                <button type="button" onClick={() => { setShowOpeningForm(false); setOpeningAdHocItems([]); setNewAdHocItem(''); setEditingOpening(false); }} className="btn btn-secondary flex-1">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Closing Form Modal ─── */}
      {showClosingForm && templates.closing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Moon className="text-purple-500" size={28} />
              Checklist Closing {editingClosing && '(Edit)'}
            </h3>
            <form onSubmit={handleClosingSubmit} className="space-y-4">
              <div>
                <label className="label">Tanggal</label>
                <input type="date" name="date" className="input" defaultValue={todayStatus?.closing?.date || new Date().toISOString().split('T')[0]} required />
              </div>
              <div>
                <label className="label">Checklist Items</label>
                <div className="space-y-3 border rounded-lg p-4">
                  {templates.closing.items.map(item => {
                    const existingItem = editingClosing && todayStatus?.closing?.items?.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name={`item_${item.id}`} className="w-5 h-5 text-green-600 rounded" defaultChecked={existingItem?.checked || false} />
                          <span className="font-medium">{item.text}</span>
                          {item.required && <span className="text-red-500">*</span>}
                        </label>
                        <input type="text" name={`note_${item.id}`} placeholder="Catatan (opsional, contoh: surplus 100)" className="input text-sm ml-7" defaultValue={existingItem?.note || ''} />
                      </div>
                    );
                  })}
                  {closingAdHocItems.map((item, idx) => (
                    <div key={`closing_adhoc_${idx}`} className="space-y-2 bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name={`closing_adhoc_${idx}`} className="w-5 h-5 text-blue-600 rounded" />
                          <span className="font-medium text-blue-800">{item.text}</span>
                          <span className="text-xs text-blue-500">(tambahan)</span>
                        </label>
                        <button type="button" onClick={() => removeClosingAdHocItem(idx)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                      </div>
                      <input type="text" name={`closing_adhoc_note_${idx}`} placeholder="Catatan (opsional)" className="input text-sm ml-7" />
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <label className="label text-blue-600">Tambah Item Checklist</label>
                    <div className="flex gap-2">
                      <input type="text" value={newAdHocItem} onChange={(e) => setNewAdHocItem(e.target.value)} placeholder="Ketik item tambahan..." className="input flex-1" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addClosingAdHocItem(); } }} />
                      <button type="button" onClick={addClosingAdHocItem} className="btn btn-primary flex items-center gap-1"><PlusCircle size={18} /> Tambah</button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="label flex items-center gap-2"><DollarSign size={18} className="text-green-500" /> Total Penjualan Hari Ini (Rp)</label>
                <input type="number" name="daily_sales" className="input" placeholder="Contoh: 1500000" defaultValue={todayStatus?.closing?.daily_sales || ''} min="0" />
              </div>
              <div>
                <label className="label">Catatan Tambahan (opsional)</label>
                <textarea name="additional_notes" className="input" rows="2" placeholder="Catatan tambahan untuk closing..." defaultValue={todayStatus?.closing?.additional_notes || ''}></textarea>
              </div>
              <div>
                <label className="label font-bold">Jadwal Jaga Besok</label>
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="label text-sm">Shift Pagi</label>
                    <select name="next_shift_morning" className="input" defaultValue={todayStatus?.closing?.next_shift_morning || ''}>
                      <option value="">-- Pilih Staf --</option>
                      {staffList.map(staff => <option key={staff.id} value={staff.name}>{staff.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Shift Siang</label>
                    <select name="next_shift_afternoon" className="input" defaultValue={todayStatus?.closing?.next_shift_afternoon || ''}>
                      <option value="">-- Pilih Staf --</option>
                      {staffList.map(staff => <option key={staff.id} value={staff.name}>{staff.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Shift Stok</label>
                    <select name="next_shift_stock" className="input" defaultValue={todayStatus?.closing?.next_shift_stock || ''}>
                      <option value="">-- Pilih Staf --</option>
                      {staffList.map(staff => <option key={staff.id} value={staff.name}>{staff.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-success flex-1">Simpan</button>
                <button type="button" onClick={() => { setShowClosingForm(false); setClosingAdHocItems([]); setNewAdHocItem(''); setEditingClosing(false); }} className="btn btn-secondary flex-1">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
