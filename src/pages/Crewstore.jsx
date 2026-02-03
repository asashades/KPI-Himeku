import { useState, useEffect } from 'react';
import { Sun, Moon, Plus, CheckCircle, PlusCircle, X, DollarSign, Droplet, Edit2 } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
    // Get current user from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      } catch (e) {}
    }
  }, []);

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

  // Check if user can edit (admin or the one who created)
  const canEditOpening = () => {
    if (!currentUser || !todayStatus?.opening) return false;
    return currentUser.role === 'admin' || todayStatus.opening.completed_by === currentUser.id;
  };

  const canEditClosing = () => {
    if (!currentUser || !todayStatus?.closing) return false;
    return currentUser.role === 'admin' || todayStatus.closing.completed_by === currentUser.id;
  };

  // Handle edit opening
  const handleEditOpening = () => {
    if (todayStatus?.opening) {
      // Load existing ad-hoc items
      const adHocItems = todayStatus.opening.items.filter(i => i.isAdHoc).map(i => ({ text: i.text }));
      setOpeningAdHocItems(adHocItems);
      setEditingOpening(true);
      setShowOpeningForm(true);
    }
  };

  // Handle edit closing
  const handleEditClosing = () => {
    if (todayStatus?.closing) {
      const adHocItems = todayStatus.closing.items.filter(i => i.isAdHoc).map(i => ({ text: i.text }));
      setClosingAdHocItems(adHocItems);
      setEditingClosing(true);
      setShowClosingForm(true);
    }
  };

  // Handle opening submit (create or update)
  const handleOpeningSubmitWithEdit = async (e) => {
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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

  // Handle closing submit (create or update)
  const handleClosingSubmitWithEdit = async (e) => {
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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

  // Calculate progress percentage
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Crewstore</h1>
        <p className="text-gray-600 mt-1">Checklist Opening & Closing toko</p>
      </div>

      {/* Today's Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opening Card */}
        <div className={`card ${
          todayStatus?.opening_completed 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200' 
            : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                todayStatus?.opening_completed ? 'bg-green-500' : 'bg-yellow-500'
              }`}>
                <Sun className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Opening</h2>
                <p className="text-sm text-gray-600">{todayStatus?.date}</p>
              </div>
            </div>
            <div className={`text-3xl ${
              todayStatus?.opening_completed ? 'text-green-600' : 'text-yellow-600'
            }`}>
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
                    <button
                      onClick={handleEditOpening}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Opening"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    getOpeningProgress() === 100 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${getOpeningProgress()}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {todayStatus.opening.items.filter(i => i.checked).length}/{todayStatus.opening.items.length} item
                </span>
                <span className={`font-bold ${getOpeningProgress() === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {getOpeningProgress()}%
                </span>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Checklist:</p>
                <div className="space-y-1">
                  {todayStatus.opening.items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <span className={item.checked ? 'text-green-600' : 'text-gray-400'}>
                        {item.checked ? '✓' : '○'}
                      </span>
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
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Status Keran:</span> {todayStatus.opening.tap_status}
                  </p>
                  {todayStatus.opening.tap_notes && (
                    <p className="text-xs text-gray-600 mt-1">{todayStatus.opening.tap_notes}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-4">Belum ada checklist opening untuk hari ini.</p>
              <button
                onClick={() => setShowOpeningForm(true)}
                className="btn btn-success w-full flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Isi Checklist Opening
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
              <div className={`p-3 rounded-lg ${
                todayStatus?.closing_completed ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                <Moon className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Closing</h2>
                <p className="text-sm text-gray-600">{todayStatus?.date}</p>
              </div>
            </div>
            <div className={`text-3xl ${
              todayStatus?.closing_completed ? 'text-green-600' : 'text-orange-600'
            }`}>
              {todayStatus?.closing_completed ? '✓' : '⏳'}
            </div>
          </div>

          {todayStatus?.closing ? (
            <div className="space-y-3">
              {/* Sales + Edit Button */}
              <div className="flex items-center justify-between">
                {todayStatus.closing.daily_sales > 0 ? (
                  <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2 flex-1">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="text-sm text-green-700">Penjualan:</span>
                    <span className="font-bold text-green-800">
                      Rp {todayStatus.closing.daily_sales.toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <div></div>
                )}
                {canEditClosing() && (
                  <button
                    onClick={handleEditClosing}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded ml-2"
                    title="Edit Closing"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    getClosingProgress() === 100 ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${getClosingProgress()}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {todayStatus.closing.items.filter(i => i.checked).length}/{todayStatus.closing.items.length} item
                </span>
                <span className={`font-bold ${getClosingProgress() === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {getClosingProgress()}%
                </span>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Checklist:</p>
                <div className="space-y-1">
                  {todayStatus.closing.items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <span className={item.checked ? 'text-green-600' : 'text-gray-400'}>
                        {item.checked ? '✓' : '○'}
                      </span>
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
              <button
                onClick={() => setShowClosingForm(true)}
                className="btn btn-success w-full flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Isi Checklist Closing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Opening Form Modal */}
      {showOpeningForm && templates.opening && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sun className="text-yellow-500" size={28} />
              Checklist Opening {editingOpening && '(Edit)'}
            </h3>
            <form onSubmit={editingOpening ? handleOpeningSubmitWithEdit : handleOpeningSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tanggal</label>
                  <input
                    type="date"
                    name="date"
                    className="input"
                    defaultValue={editingOpening?.date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="label">Jam Buka</label>
                  <input type="time" name="open_time" className="input" defaultValue={editingOpening?.open_time || ''} required />
                </div>
              </div>

              <div>
                <label className="label">Checklist Items</label>
                <div className="space-y-3 border rounded-lg p-4">
                  {templates.opening.items.map(item => {
                    const isChecked = editingOpening?.items?.some(i => i.id === item.id && i.checked) || false;
                    const itemNote = editingOpening?.items?.find(i => i.id === item.id)?.note || '';
                    return (
                      <div key={item.id} className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name={`item_${item.id}`}
                            className="w-5 h-5 text-green-600 rounded"
                            defaultChecked={isChecked}
                          />
                          <span className="font-medium">{item.text}</span>
                          {item.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          name={`note_${item.id}`}
                          placeholder="Catatan (opsional)"
                          className="input text-sm ml-7"
                          defaultValue={itemNote}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Ad-hoc items */}
                  {openingAdHocItems.map((item, idx) => (
                    <div key={`adhoc_${idx}`} className="space-y-2 bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name={`adhoc_${idx}`}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <span className="font-medium text-blue-800">{item.text}</span>
                          <span className="text-xs text-blue-500">(tambahan)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeOpeningAdHocItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <input
                        type="text"
                        name={`adhoc_note_${idx}`}
                        placeholder="Catatan (opsional)"
                        className="input text-sm ml-7"
                      />
                    </div>
                  ))}
                  
                  {/* Add ad-hoc item */}
                  <div className="border-t pt-3 mt-3">
                    <label className="label text-blue-600">Tambah Item Checklist</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAdHocItem}
                        onChange={(e) => setNewAdHocItem(e.target.value)}
                        placeholder="Ketik item tambahan..."
                        className="input flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOpeningAdHocItem())}
                      />
                      <button
                        type="button"
                        onClick={addOpeningAdHocItem}
                        className="btn btn-primary flex items-center gap-1"
                      >
                        <PlusCircle size={18} /> Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tap status - only show if enabled in template */}
              {templates.opening.tap_enabled !== false && (
                <>
                  <div>
                    <label className="label flex items-center gap-2">
                      <Droplet size={18} className="text-blue-500" />
                      Status Keran
                    </label>
                    <select name="tap_status" className="input">
                      <option value="">-- Pilih Status --</option>
                      <option value="Nyala">Nyala</option>
                      <option value="Mati">Mati</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Catatan Keran (opsional)</label>
                    <textarea
                      name="tap_notes"
                      className="input"
                      rows="2"
                      placeholder="Catatan tambahan tentang keran..."
                    ></textarea>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-success flex-1">Simpan</button>
                <button
                  type="button"
                  onClick={() => { setShowOpeningForm(false); setOpeningAdHocItems([]); setNewAdHocItem(''); }}
                  className="btn btn-secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Closing Form Modal */}
      {showClosingForm && templates.closing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Moon className="text-purple-500" size={28} />
              Checklist Closing {editingClosing && '(Edit)'}
            </h3>
            <form onSubmit={editingClosing ? handleClosingSubmitWithEdit : handleClosingSubmit} className="space-y-4">
              <div>
                <label className="label">Tanggal</label>
                <input
                  type="date"
                  name="date"
                  className="input"
                  defaultValue={editingClosing?.date || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="label">Checklist Items</label>
                <div className="space-y-3 border rounded-lg p-4">
                  {templates.closing.items.map(item => {
                    const isChecked = editingClosing?.items?.some(i => i.id === item.id && i.checked) || false;
                    const itemNote = editingClosing?.items?.find(i => i.id === item.id)?.note || '';
                    return (
                      <div key={item.id} className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name={`item_${item.id}`}
                            className="w-5 h-5 text-green-600 rounded"
                            defaultChecked={isChecked}
                          />
                          <span className="font-medium">{item.text}</span>
                          {item.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          name={`note_${item.id}`}
                          placeholder="Catatan (opsional, contoh: surplus 100)"
                          className="input text-sm ml-7"
                          defaultValue={itemNote}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Ad-hoc items */}
                  {closingAdHocItems.map((item, idx) => (
                    <div key={`closing_adhoc_${idx}`} className="space-y-2 bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name={`closing_adhoc_${idx}`}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <span className="font-medium text-blue-800">{item.text}</span>
                          <span className="text-xs text-blue-500">(tambahan)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeClosingAdHocItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <input
                        type="text"
                        name={`closing_adhoc_note_${idx}`}
                        placeholder="Catatan (opsional)"
                        className="input text-sm ml-7"
                      />
                    </div>
                  ))}
                  
                  {/* Add ad-hoc item */}
                  <div className="border-t pt-3 mt-3">
                    <label className="label text-blue-600">Tambah Item Checklist</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAdHocItem}
                        onChange={(e) => setNewAdHocItem(e.target.value)}
                        placeholder="Ketik item tambahan..."
                        className="input flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClosingAdHocItem())}
                      />
                      <button
                        type="button"
                        onClick={addClosingAdHocItem}
                        className="btn btn-primary flex items-center gap-1"
                      >
                        <PlusCircle size={18} /> Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Sales */}
              <div>
                <label className="label flex items-center gap-2">
                  <DollarSign size={18} className="text-green-500" />
                  Total Penjualan Hari Ini (Rp)
                </label>
                <input
                  type="number"
                  name="daily_sales"
                  className="input"
                  placeholder="Contoh: 1500000"
                  defaultValue={editingClosing?.daily_sales || ''}
                  min="0"
                />
              </div>

              <div>
                <label className="label">Catatan Tambahan (opsional)</label>
                <textarea
                  name="additional_notes"
                  className="input"
                  rows="2"
                  placeholder="Catatan tambahan untuk closing..."
                  defaultValue={editingClosing?.additional_notes || ''}
                ></textarea>
              </div>

              <div>
                <label className="label font-bold">Jadwal Jaga Besok</label>
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="label text-sm">Shift Pagi</label>
                    <select
                      name="next_shift_morning"
                      className="input"
                      defaultValue={editingClosing?.next_shift_morning || ''}
                    >
                      <option value="">-- Pilih Staf --</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.name}>{staff.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Shift Siang</label>
                    <select
                      name="next_shift_afternoon"
                      className="input"
                      defaultValue={editingClosing?.next_shift_afternoon || ''}
                    >
                      <option value="">-- Pilih Staf --</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.name}>{staff.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm">Shift Stok</label>
                    <select
                      name="next_shift_stock"
                      className="input"
                      defaultValue={editingClosing?.next_shift_stock || ''}
                    >
                      <option value="">-- Pilih Staf --</option>
                      {staffList.map(staff => (
                        <option key={staff.id} value={staff.name}>{staff.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-success flex-1">Simpan</button>
                <button
                  type="button"
                  onClick={() => { setShowClosingForm(false); setClosingAdHocItems([]); setNewAdHocItem(''); }}
                  className="btn btn-secondary flex-1"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
