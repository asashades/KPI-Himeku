import { useState, useEffect } from 'react';
import { Video, Package, Store, TrendingUp, Instagram, AlertTriangle, DollarSign, Droplet, Clock, CheckCircle, Sparkles } from 'lucide-react';

// Dynamic Gen-Z greeting template generator
function generateGreeting(overview) {
  if (!overview) return { text: 'Haiii bestie! Loading data dulu ya... ⏳', emoji: '👋' };

  const blocks = [];

  // Block 1: Host & Creator performance
  const hostProgress = overview?.hostLive?.progress || 0;
  const creatorProgress = overview?.contentCreator?.progress || 0;
  if (hostProgress >= 80 && creatorProgress >= 80) {
    blocks.push('Host Live & Creator lagi on fire banget! Literally ate and left no crumbs! 🔥💅');
  } else if (hostProgress >= 50) {
    blocks.push(`Host Live udah ${hostProgress.toFixed(0)}% target — keep grinding bestie! Creator juga jalan terus! 💪`);
  } else if (hostProgress > 0) {
    blocks.push(`Host Live masih ${hostProgress.toFixed(0)}% nih, gas terus biar makin slay! Creator juga harus push! 🚀`);
  } else {
    blocks.push('Host Live & Creator belum ada data bulan ini. Let\'s get it started bestie! 🎬');
  }

  // Block 2: Store status
  const openingDone = overview?.crewstore?.openingCompleted;
  const closingDone = overview?.crewstore?.closingCompleted;
  const sales = overview?.crewstore?.monthlySales || 0;
  if (openingDone && closingDone) {
    blocks.push(`Crewstore udah opening + closing today — main character energy! ${sales > 0 ? `Sales Rp ${sales.toLocaleString('id-ID')} so far, iconic! 💰` : '✨'}`);
  } else if (openingDone) {
    blocks.push('Crewstore udah buka, tinggal closing nanti ya bestie! Semangat jualan! 🛍️');
  } else {
    blocks.push('Crewstore belum opening hari ini — jangan lupa checklist-nya ya bestie! ⏰');
  }

  // Block 3: Warehouse alerts
  const pendingCount = overview?.pendingItems?.length || 0;
  const restockCount = overview?.restockItems?.length || 0;
  const wrongOrders = overview?.warehouse?.wrongOrders?.total || 0;
  if (pendingCount === 0 && restockCount === 0 && wrongOrders === 0) {
    blocks.push('Warehouse bersih, no pending, no restock needed — literally immaculate! ✅');
  } else {
    const alerts = [];
    if (pendingCount > 0) alerts.push(`${pendingCount} pending`);
    if (restockCount > 0) alerts.push(`${restockCount} restock`);
    if (wrongOrders > 0) alerts.push(`${wrongOrders} salah pesanan`);
    blocks.push(`Warehouse ada ${alerts.join(', ')} — let's clear it out bestie! 📦`);
  }

  // Block 4: Closing statement
  const hour = new Date().getHours();
  if (hour < 12) {
    blocks.push('Morning vibes! Start the day right, you got this fr fr! ☀️');
  } else if (hour < 17) {
    blocks.push('Afternoon hustle mode! Keep that energy bestie! 💫');
  } else {
    blocks.push('Almost done for today! Finish strong and rest well bestie! 🌙');
  }

  return { text: blocks.join('\n\n'), emoji: '💬' };
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && !data.error) {
        setOverview(data);
      } else {
        console.error('Dashboard API error:', data?.error);
        setOverview(null);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Gagal memuat data dashboard</div>
      </div>
    );
  }

  const greeting = generateGreeting(overview);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview performa semua departemen</p>
      </div>

      {/* ─── Dynamic Gen-Z Greeting ─── */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg mt-1">
            <Sparkles className="text-yellow-300" size={24} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg mb-2">Hey bestie! Here's your daily vibe check 💅</p>
            <div className="text-sm text-white/90 whitespace-pre-line leading-relaxed">
              {greeting.text}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Department Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Host Live Card */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500 rounded-lg">
                <Video className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-red-800">Host Live</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-red-700 mb-1">Progress Jam Tayang Bulan Ini</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-red-900">{overview?.hostLive?.currentHours?.toFixed(1) || 0}</span>
                <span className="text-lg text-red-700 mb-1">/ {overview?.hostLive?.targetHours?.toFixed(0) || 0} jam</span>
              </div>
            </div>
            <div className="w-full bg-red-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(overview?.hostLive?.progress || 0, 100)}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-700">{overview?.hostLive?.totalHosts || 0} Host Aktif</span>
              <span className="font-bold text-red-900">{(overview?.hostLive?.progress || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Content Creator Card */}
        <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-500 rounded-lg">
                <Instagram className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-pink-800">Content Creator</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-pink-700 mb-1">Konten Bulan Ini</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-pink-900">{overview?.contentCreator?.totalPosts || 0}</span>
                <span className="text-lg text-pink-700 mb-1">/ {overview?.contentCreator?.targetPosts || 30} post</span>
              </div>
            </div>
            <div className="w-full bg-pink-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(overview?.contentCreator?.progress || 0, 100)}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-pink-700">{overview?.contentCreator?.totalCreators || 0} Creator</span>
              <span className="font-bold text-pink-900">{(overview?.contentCreator?.progress || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Warehouse Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Package className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-blue-800">Warehouse</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-blue-700 mb-1">Checklist Hari Ini</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-blue-900">{overview?.warehouse?.completedChecklists || 0}</span>
                <span className="text-lg text-blue-700 mb-1">/ {overview?.warehouse?.totalChecklists || 0} selesai</span>
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(overview?.warehouse?.progress || 0, 100)}%` }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">{overview?.warehouse?.totalChecklists > 0 ? 'Ada tugas' : 'Belum ada tugas'}</span>
              <span className="font-bold text-blue-900">{(overview?.warehouse?.progress || 0).toFixed(0)}%</span>
            </div>
            <div className="border-t border-blue-200 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <span className="text-sm text-blue-700">Salah Pesanan</span>
                </div>
                <span className={`font-bold ${(overview?.warehouse?.wrongOrders?.total || 0) > (overview?.warehouse?.wrongOrders?.target || 5) ? 'text-red-600' : 'text-green-600'}`}>
                  {overview?.warehouse?.wrongOrders?.total || 0} / {overview?.warehouse?.wrongOrders?.target || 5} maks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Crewstore Card */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-lg">
                <Store className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-green-800">Crewstore</h3>
            </div>
          </div>
          <div className="space-y-3">
            {overview?.crewstore?.targetSales > 0 && (
              <div>
                <p className="text-sm text-green-700 mb-1 flex items-center gap-1"><DollarSign size={14} /> Penjualan Bulan Ini</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-green-900">Rp {(overview?.crewstore?.monthlySales || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((overview?.crewstore?.monthlySales / overview?.crewstore?.targetSales) * 100 || 0, 100)}%` }} />
                </div>
                <p className="text-xs text-green-600 mt-1">Target: Rp {overview?.crewstore?.targetSales?.toLocaleString('id-ID')}</p>
              </div>
            )}
            <div className="border-t border-green-200 pt-3">
              <p className="text-sm text-green-700 mb-2">Status Hari Ini</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Clock size={14} /> Opening</span>
                  {overview?.crewstore?.openingCompleted ? (
                    <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Selesai</span>
                  ) : (
                    <span className="text-yellow-600 font-bold">⏳ Belum</span>
                  )}
                </div>
                {overview?.crewstore?.openingProgress !== undefined && (
                  <div className="px-2">
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${overview?.crewstore?.openingProgress || 0}%` }} />
                    </div>
                    <p className="text-xs text-green-600 mt-1 text-right">{overview?.crewstore?.openingProgress || 0}%</p>
                  </div>
                )}
                <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Clock size={14} /> Closing</span>
                  {overview?.crewstore?.closingCompleted ? (
                    <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Selesai</span>
                  ) : (
                    <span className="text-yellow-600 font-bold">⏳ Belum</span>
                  )}
                </div>
                {overview?.crewstore?.closingProgress !== undefined && (
                  <div className="px-2">
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${overview?.crewstore?.closingProgress || 0}%` }} />
                    </div>
                    <p className="text-xs text-purple-600 mt-1 text-right">{overview?.crewstore?.closingProgress || 0}%</p>
                  </div>
                )}
              </div>
            </div>
            {overview?.crewstore?.tapStatus && (
              <div className="border-t border-green-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 flex items-center gap-1"><Droplet size={14} /> Status Keran</span>
                  <span className={`font-bold ${overview?.crewstore?.tapStatus === 'Nyala' ? 'text-blue-600' : 'text-red-600'}`}>{overview?.crewstore?.tapStatus}</span>
                </div>
              </div>
            )}
            <div className="border-t border-green-200 pt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700">Tepat Waktu Buka</span>
                <span className="font-bold text-green-900">{overview?.crewstore?.onTimeOpenings || 0} / {overview?.crewstore?.openingDays || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pending & Restock Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Card */}
        <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">Pending</h3>
              <p className="text-sm text-blue-600">{overview?.pendingItems?.length || 0} item belum selesai</p>
            </div>
          </div>
          {(!overview?.pendingItems || overview.pendingItems.length === 0) ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-green-600 font-bold">Semua pesanan clear!</p>
              <p className="text-sm text-green-500">No pending, vibes immaculate ✨</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {overview.pendingItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-blue-100">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-gray-800 text-sm flex-1">{item.text}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">{item.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restock Card */}
        <div className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-800">Butuh Restock</h3>
              <p className="text-sm text-orange-600">{overview?.restockItems?.length || 0} item perlu restock</p>
            </div>
          </div>
          {(!overview?.restockItems || overview.restockItems.length === 0) ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🎊</div>
              <p className="text-green-600 font-bold">Stok aman semua!</p>
              <p className="text-sm text-green-500">No restock needed bestie~ 💅</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {overview.restockItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-orange-100">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  <span className="text-gray-800 text-sm flex-1">{item.text}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{item.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
