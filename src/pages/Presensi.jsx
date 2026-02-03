import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Clock, 
  Upload, 
  History, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  Filter,
  Image,
  X,
  Sun,
  Moon,
  Sunset
} from 'lucide-react';

export default function Presensi({ user }) {
  const [activeTab, setActiveTab] = useState('presensi');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    jenis: 'Masuk',
    shift: '',
    foto: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    jenis: ''
  });
  
  const fileInputRef = useRef(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load riwayat when tab changes
  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetchRiwayat();
    }
  }, [activeTab]);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const showNotificationMessage = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchRiwayat = async () => {
    setLoadingRiwayat(true);
    try {
      const token = localStorage.getItem('token');
      let url = '/api/presensi?';
      
      if (filter.startDate && filter.endDate) {
        url += `startDate=${filter.startDate}&endDate=${filter.endDate}&`;
      }
      if (filter.jenis) {
        url += `jenis=${filter.jenis}&`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRiwayat(data);
      }
    } catch (error) {
      console.error('Error fetching riwayat:', error);
      showNotificationMessage('error', 'Gagal memuat riwayat presensi');
    } finally {
      setLoadingRiwayat(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/presensi/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotificationMessage('error', 'File harus berupa gambar!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotificationMessage('error', 'Ukuran file maksimal 5MB!');
      return;
    }

    setFormData({ ...formData, foto: file });
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setFormData({ ...formData, foto: null });
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.shift) {
      showNotificationMessage('error', 'Silakan pilih shift!');
      return;
    }

    if (!formData.foto) {
      showNotificationMessage('error', 'Silakan upload foto selfie!');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Upload foto ke Google Drive via backend
      let fotoUrl = null;
      if (preview) {
        try {
          const uploadResponse = await fetch('/api/presensi/upload-foto', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              base64: preview,
              filename: formData.foto?.name || 'presensi.jpg',
              mimeType: formData.foto?.type || 'image/jpeg'
            })
          });
          
          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            fotoUrl = uploadData.directUrl;
          } else {
            // Fallback ke base64 jika upload gagal
            fotoUrl = preview;
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          // Fallback ke base64
          fotoUrl = preview;
        }
      }
      
      // Submit presensi
      const response = await fetch('/api/presensi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jenis: formData.jenis,
          shift: formData.shift,
          foto_url: fotoUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotificationMessage('success', 'Presensi berhasil dicatat!');
        setFormData({ jenis: 'Masuk', shift: '', foto: null });
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchStats();
      } else {
        showNotificationMessage('error', data.error || 'Gagal mencatat presensi');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotificationMessage('error', 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    fetchRiwayat();
  };

  const getShiftIcon = (shift) => {
    switch (shift) {
      case 'Pagi': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'Sore': return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'Malam': return <Moon className="w-4 h-4 text-indigo-500" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in
          ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : ''}
          ${notification.type === 'error' ? 'bg-red-50 border border-red-200' : ''}
          ${notification.type === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
        `}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
          {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
          <span className="text-gray-700 font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Camera className="w-7 h-7 text-indigo-600" />
          Presensi Karyawan
        </h1>
        <p className="text-gray-500 mt-1">Catat kehadiran Anda dengan mudah</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-indigo-600">{stats.daysWorked}</div>
            <div className="text-sm text-gray-500">Hari Kerja</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.onTimeCount}</div>
            <div className="text-sm text-gray-500">Tepat Waktu</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">{stats.lateCount}</div>
            <div className="text-sm text-gray-500">Terlambat</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.totalMasuk}</div>
            <div className="text-sm text-gray-500">Total Check-in</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-white rounded-xl p-2 shadow-sm border mb-6">
        <button
          onClick={() => setActiveTab('presensi')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
            ${activeTab === 'presensi' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <Camera className="w-5 h-5" />
          <span>Presensi</span>
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2
            ${activeTab === 'riwayat' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <History className="w-5 h-5" />
          <span>Riwayat</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'presensi' && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <Camera className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Form Presensi</h2>
            <p className="text-gray-500 text-sm mt-1">Isi form berikut untuk mencatat kehadiran</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Time */}
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Waktu Saat Ini</p>
                    <p className="font-bold text-gray-800">{formatDateTime(currentTime)}</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Jenis Presensi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Jenis Presensi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`block cursor-pointer text-center py-4 px-4 rounded-xl border-2 transition-all
                  ${formData.jenis === 'Masuk' 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                  <input
                    type="radio"
                    name="jenis"
                    value="Masuk"
                    checked={formData.jenis === 'Masuk'}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    className="hidden"
                  />
                  <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${formData.jenis === 'Masuk' ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <p className="font-semibold">Masuk</p>
                  <p className="text-xs text-gray-500">Clock In</p>
                </label>
                <label className={`block cursor-pointer text-center py-4 px-4 rounded-xl border-2 transition-all
                  ${formData.jenis === 'Pulang' 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                  <input
                    type="radio"
                    name="jenis"
                    value="Pulang"
                    checked={formData.jenis === 'Pulang'}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    className="hidden"
                  />
                  <XCircle className={`w-8 h-8 mx-auto mb-2 ${formData.jenis === 'Pulang' ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <p className="font-semibold">Pulang</p>
                  <p className="text-xs text-gray-500">Clock Out</p>
                </label>
              </div>
            </div>

            {/* Shift Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Shift
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all"
                required
              >
                <option value="">-- Pilih Shift --</option>
                <option value="Pagi">🌅 Shift Pagi (Maks 09:00)</option>
                <option value="Siang">☀️ Shift Siang (Maks 13:00)</option>
                <option value="Part Time Pagi">🌤️ Part Time Pagi (Maks 09:00)</option>
                <option value="Part Time Sore">🌆 Part Time Sore (Maks 16:00)</option>
              </select>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto Selfie
              </label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${preview ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {preview ? (
                  <div>
                    <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-xl mx-auto mb-3 shadow-lg" />
                    <p className="font-medium text-gray-700">{formData.foto?.name}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="mt-2 text-sm text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="font-medium text-gray-700">Klik atau drag foto ke sini</p>
                    <p className="text-sm text-gray-500 mt-1">Format: JPG, PNG (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Mengirim...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Kirim Presensi
                </span>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <History className="w-6 h-6 text-indigo-500" />
                Riwayat Presensi
              </h2>
              <p className="text-gray-500 text-sm mt-1">Daftar kehadiran Anda</p>
            </div>
            <button
              onClick={fetchRiwayat}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRiwayat ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filter */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Tanggal Akhir</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Jenis</label>
              <select
                value={filter.jenis}
                onChange={(e) => setFilter({ ...filter, jenis: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm bg-white"
              >
                <option value="">Semua</option>
                <option value="Masuk">Masuk</option>
                <option value="Pulang">Pulang</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilter}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-1 transition-all"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Table */}
          {loadingRiwayat ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : riwayat.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Belum ada riwayat presensi</p>
              <p className="text-gray-400 text-sm mt-1">Mulai presensi untuk melihat riwayat</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jenis</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Shift</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {riwayat.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">
                          {new Date(item.timestamp).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium
                          ${item.jenis === 'Masuk' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                        `}>
                          {item.jenis}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {getShiftIcon(item.shift)}
                          {item.shift}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.foto_url ? (
                          <button
                            onClick={() => setShowImageModal(item.foto_url)}
                            className="text-indigo-500 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Image className="w-4 h-4" />
                            Lihat
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <span className="text-4xl">😊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Presensi</h3>
              <p className="text-gray-500 mb-6">
                Apakah Anda yakin sudah <span className="font-semibold text-indigo-600">cantik/ganteng</span> hari ini?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
                >
                  Yakin!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowImageModal(null)} />
          <div className="relative max-w-lg w-full">
            <img src={showImageModal} alt="Foto Presensi" className="w-full rounded-2xl shadow-2xl" />
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
