import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, Search, Users, CheckCircle, TrendingDown } from 'lucide-react';

export default function RekapPresensi({ user }) {
  const [rekap, setRekap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({ totalKaryawan: 0, totalHadir: 0, totalTepat: 0, totalTerlambat: 0 });

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchRekap();
    }
  }, [startDate, endDate]);

  const fetchRekap = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/presensi/rekap-kehadiran?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRekap(Array.isArray(data) ? data : []);
      
      // Calculate summary
      const totalKaryawan = data.length;
      const totalHadir = data.reduce((sum, r) => sum + (r.total_hadir || 0), 0);
      const totalTepat = data.reduce((sum, r) => sum + (r.tepat_waktu || 0), 0);
      const totalTerlambat = data.reduce((sum, r) => sum + (r.terlambat || 0), 0);
      setSummary({
        totalKaryawan,
        totalHadir,
        totalTepat,
        totalTerlambat
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes) => {
    if (!minutes || minutes === 0) return '0 menit';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} jam ${mins} menit`;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Akses Ditolak</h2>
        <p className="text-gray-500">Halaman ini hanya untuk admin</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-500" />
          Rekap Kehadiran Presensi
        </h1>
        <p className="text-gray-500 mt-1">Monitor kehadiran karyawan berdasarkan nama</p>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchRekap}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Search size={18} />
            Cari
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Karyawan</p>
              <p className="text-2xl font-bold text-gray-800">{summary.totalKaryawan}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Kehadiran</p>
              <p className="text-2xl font-bold text-gray-800">{summary.totalHadir}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tepat Waktu</p>
              <p className="text-2xl font-bold text-green-600">{summary.totalTepat}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terlambat</p>
              <p className="text-2xl font-bold text-red-600">{summary.totalTerlambat}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rekap Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-2">Memuat data...</p>
          </div>
        ) : rekap.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Tidak ada data kehadiran dalam periode ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama Karyawan</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Jumlah Hadir</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Tepat Waktu</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Terlambat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Waktu Terlambat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rekap.map((item, index) => (
                  <tr key={item.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-800">{item.staff_name}</p>
                        <p className="text-xs text-gray-500">@{item.username}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                        {item.total_hadir}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                        {item.tepat_waktu}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full font-bold ${
                        item.terlambat > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.terlambat}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        item.total_menit_terlambat > 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {formatMinutes(item.total_menit_terlambat)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
