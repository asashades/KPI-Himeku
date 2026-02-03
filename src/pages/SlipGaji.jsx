import { useState, useEffect } from 'react';
import { Receipt, Search, Calendar, DollarSign, TrendingUp, TrendingDown, Filter, X, Sparkles, Building2, User, CreditCard, Banknote } from 'lucide-react';

const encourageMessages = [
  "Gaji sudah cair! Time to treat yourself bestie! 💸",
  "Payday vibes are immaculate rn! 🔥",
  "Kerja keras never disappoints fr fr! 💪",
  "Your bank account is thriving bestie! ✨",
  "Slay queen/king! Gaji = self-care time! 🛍️",
  "Main character energy with that salary! 👑",
  "Living your best financial era! 💅",
  "No cap, you deserve every rupiah! 🎉",
  "Financial glow up loading... 📈",
  "Alexa play Money by Lisa! 💰"
];

const getRandomEncourage = () => encourageMessages[Math.floor(Math.random() * encourageMessages.length)];

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getMonthName = (month) => {
  const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return months[parseInt(month)] || month;
};

export default function SlipGaji({ user }) {
  const [slipList, setSlipList] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [encourageMsg, setEncourageMsg] = useState(getRandomEncourage());
  const [filterEmail, setFilterEmail] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSlipGaji();
    if (isAdmin) {
      fetchEmployees();
    }
  }, [filterEmail]);

  const fetchSlipGaji = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filterEmail 
        ? `/api/slipgaji?email=${encodeURIComponent(filterEmail)}`
        : '/api/slipgaji';
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSlipList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching slip gaji:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/slipgaji/employees/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const parseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-gray-500">Loading slip gaji... 💸</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="text-green-500" />
            Slip Gaji
          </h1>
          <p className="text-gray-600 mt-1">Your earnings history bestie! 💰</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowFilter(true)} className="btn bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-2">
            <Filter size={20} /> Filter Karyawan
          </button>
        )}
      </div>

      {/* Encourage Message */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <p className="font-medium text-lg">{encourageMsg}</p>
        </div>
      </div>

      {/* Filter Info */}
      {filterEmail && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-blue-700">Menampilkan slip untuk: <strong>{filterEmail}</strong></span>
          <button onClick={() => setFilterEmail('')} className="text-blue-600 hover:text-blue-800">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {slipList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <Banknote className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gaji Terakhir</p>
                <p className="text-xl font-bold text-green-600">{formatRupiah(slipList[0]?.gaji_bersih || 0)}</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bonus</p>
                <p className="text-xl font-bold text-blue-600">{formatRupiah(slipList[0]?.total_bonus || 0)}</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Receipt className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Jumlah Slip</p>
                <p className="text-xl font-bold text-purple-600">{slipList.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slip List */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">History Slip Gaji 📋</h3>
        <div className="space-y-3">
          {slipList.map((slip) => (
            <div
              key={slip.no_slip}
              onClick={() => { setSelectedSlip(slip); setEncourageMsg(getRandomEncourage()); }}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-green-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Receipt className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{slip.no_slip}</p>
                  <p className="text-sm text-gray-500">{getMonthName(slip.bulan)} {slip.tahun}</p>
                  {isAdmin && <p className="text-xs text-blue-600">{slip.nama}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 text-lg">{formatRupiah(slip.gaji_bersih)}</p>
                <p className="text-xs text-gray-500">Gaji Bersih</p>
              </div>
            </div>
          ))}
        </div>

        {slipList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Belum ada slip gaji</p>
            <p className="text-sm">Stay tuned bestie! 💪</p>
          </div>
        )}
      </div>

      {/* Slip Detail Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm text-gray-500">Detail Slip Gaji</p>
                <p className="text-xl font-bold text-gray-800">{selectedSlip.no_slip}</p>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Gaji Bersih Highlight */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white text-center mb-6">
              <p className="text-green-100 text-sm">Gaji Bersih</p>
              <p className="text-4xl font-bold">{formatRupiah(selectedSlip.gaji_bersih)}</p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <User size={16} /> Nama
                </div>
                <p className="font-medium text-gray-800">{selectedSlip.nama}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar size={16} /> Periode
                </div>
                <p className="font-medium text-gray-800">{getMonthName(selectedSlip.bulan)} {selectedSlip.tahun}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Building2 size={16} /> Departemen
                </div>
                <p className="font-medium text-gray-800">{selectedSlip.departemen || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <CreditCard size={16} /> Gaji Pokok
                </div>
                <p className="font-medium text-gray-800">{formatRupiah(selectedSlip.gaji_pokok)}</p>
              </div>
            </div>

            {/* Tunjangan */}
            {selectedSlip.total_tunjangan > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" /> Tunjangan
                </h4>
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                  {parseJSON(selectedSlip.detail_tunjangan).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-600">• {item.name}</span>
                      <span className="font-medium text-blue-600">{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                    <span>Total Tunjangan</span>
                    <span className="text-blue-600">{formatRupiah(selectedSlip.total_tunjangan)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bonus */}
            {selectedSlip.total_bonus > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-500" /> Bonus
                </h4>
                <div className="bg-green-50 rounded-xl p-4 space-y-2">
                  {parseJSON(selectedSlip.detail_bonus).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-600">• {item.name}</span>
                      <span className="font-medium text-green-600">{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-green-200 pt-2 flex justify-between font-bold">
                    <span>Total Bonus</span>
                    <span className="text-green-600">{formatRupiah(selectedSlip.total_bonus)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Potongan */}
            {selectedSlip.total_potongan > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingDown size={18} className="text-red-500" /> Potongan
                </h4>
                <div className="bg-red-50 rounded-xl p-4 space-y-2">
                  {parseJSON(selectedSlip.detail_potongan).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-600">• {item.name}</span>
                      <span className="font-medium text-red-600">-{formatRupiah(item.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-red-200 pt-2 flex justify-between font-bold">
                    <span>Total Potongan</span>
                    <span className="text-red-600">-{formatRupiah(selectedSlip.total_potongan)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pajak */}
            {selectedSlip.pajak > 0 && (
              <div className="mb-4">
                <div className="bg-orange-50 rounded-xl p-4 flex justify-between">
                  <span className="text-gray-700 font-medium">Pajak</span>
                  <span className="font-bold text-orange-600">-{formatRupiah(selectedSlip.pajak)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedSlip(null)}
              className="w-full btn btn-primary mt-4"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Filter Modal (Admin) */}
      {showFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🔍 Filter Karyawan</h3>
              <button onClick={() => setShowFilter(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <button
                onClick={() => { setFilterEmail(''); setShowFilter(false); }}
                className={`w-full p-3 rounded-lg text-left transition-all ${!filterEmail ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <p className="font-medium">Semua Karyawan</p>
                <p className="text-sm text-gray-500">Tampilkan semua slip gaji</p>
              </button>
              {employees.map((emp) => (
                <button
                  key={emp.email}
                  onClick={() => { setFilterEmail(emp.email); setShowFilter(false); }}
                  className={`w-full p-3 rounded-lg text-left transition-all ${filterEmail === emp.email ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <p className="font-medium">{emp.nama}</p>
                  <p className="text-sm text-gray-500">{emp.email}</p>
                  <p className="text-xs text-blue-500">{emp.departemen}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
