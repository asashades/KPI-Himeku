import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, Search, Users, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

export default function RekapPresensi({ user }) {
  const [rekap, setRekap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [summary, setSummary] = useState({ totalLate: 0, totalMinutes: 0, totalUsers: 0 });

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
      const res = await fetch(`/api/presensi/rekap-terlambat?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRekap(Array.isArray(data) ? data : []);
      
      // Calculate summary
      const totalLate = data.reduce((sum, r) => sum + r.late_count, 0);
      const totalMinutes = data.reduce((sum, r) => sum + r.total_late_minutes, 0);
      setSummary({
        totalLate,
        totalMinutes,
        totalUsers: data.length
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} jam ${mins} menit`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
          <Clock className="text-orange-500" />
          Rekap Keterlambatan Presensi
        </h1>
        <p className="text-gray-500 mt-1">Monitor keterlambatan karyawan</p>
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
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <button
            onClick={fetchRekap}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
          >
            <Search size={18} />
            Cari
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Karyawan Terlambat</p>
              <p className="text-2xl font-bold text-gray-800">{summary.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Keterlambatan</p>
              <p className="text-2xl font-bold text-gray-800">{summary.totalLate}x</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <TrendingDown className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Waktu Terlambat</p>
              <p className="text-2xl font-bold text-gray-800">{formatMinutes(summary.totalMinutes)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rekap Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-2">Memuat data...</p>
          </div>
        ) : rekap.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Tidak ada data keterlambatan dalam periode ini</p>
            <p className="text-sm text-gray-400">Semua karyawan tepat waktu! 🎉</p>
          </div>
        ) : (
          <div className="divide-y">
            {rekap.map((item, index) => (
              <div key={item.user_id} className="hover:bg-gray-50">
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedUser(expandedUser === item.user_id ? null : item.user_id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{item.staff_name}</p>
                      <p className="text-sm text-gray-500">@{item.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{item.late_count}x terlambat</p>
                      <p className="text-sm text-gray-500">Total {formatMinutes(item.total_late_minutes)}</p>
                    </div>
                    {expandedUser === item.user_id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                
                {/* Detail Keterlambatan */}
                {expandedUser === item.user_id && item.late_details && (
                  <div className="px-4 pb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        Detail Keterlambatan
                      </h4>
                      <div className="space-y-2">
                        {item.late_details.map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                            <div>
                              <span className="font-medium">{formatDate(detail.date)}</span>
                              <span className="text-gray-500 ml-2">({detail.shift})</span>
                            </div>
                            <span className="text-red-600 font-medium">
                              Terlambat {detail.late_minutes} menit
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
