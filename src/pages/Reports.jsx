import { useState, useEffect } from 'react';
import { FileText, Download, Filter } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    end_date: new Date().toISOString().split('T')[0] // Today
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      
      const response = await fetch(`/api/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data && !data.error ? data : {});
      } else {
        console.error('Reports API returned', response.status);
        setReports({});
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports({});
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      
      const response = await fetch(`/api/reports/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const text = await response.text();
      
      // Copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Laporan berhasil disalin ke clipboard!');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Gagal export laporan');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Laporan</h1>
        <p className="text-gray-600 mt-1">Rekap performa dan completion rate</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Filter Laporan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Departemen</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="input"
            >
              <option value="">Semua Departemen</option>
              <option value="3">Host Live</option>
              <option value="2">Warehouse</option>
              <option value="1">Crewstore</option>
            </select>
          </div>

          <div>
            <label className="label">Tanggal Mulai</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Tanggal Akhir</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="input"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={fetchReports}
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Memuat...' : 'Tampilkan'}
            </button>
            <button
              onClick={handleExport}
              className="btn btn-secondary"
              title="Export ke Clipboard"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Display */}
      {reports && (
        <div className="space-y-6">
          {/* Host Live Report */}
          {reports.hostLive && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="text-red-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Laporan Host Live</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Host</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target (jam)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tercapai (jam)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Sesi</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.hostLive.map((host, index) => {
                      const progress = host.monthly_target_hours > 0 
                        ? (host.total_hours / host.monthly_target_hours) * 100 
                        : 0;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{host.host_name}</td>
                          <td className="px-4 py-3">{host.monthly_target_hours}</td>
                          <td className="px-4 py-3 font-bold text-red-600">
                            {host.total_hours.toFixed(1)}
                          </td>
                          <td className="px-4 py-3">{host.total_sessions}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warehouse Report */}
          {reports.warehouse && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Laporan Warehouse</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Checklist</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Selesai</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.warehouse.map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{day.date}</td>
                        <td className="px-4 py-3">{day.total_checklists}</td>
                        <td className="px-4 py-3 font-bold text-blue-600">{day.completed}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${day.completion_rate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{day.completion_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Crewstore Report */}
          {reports.crewstore && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="text-green-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Laporan Crewstore</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Opening</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Closing</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.crewstore.map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{day.date}</td>
                        <td className="px-4 py-3">
                          {day.opening_count > 0 ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {day.closing_count > 0 ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            day.status === 'complete' 
                              ? 'bg-green-100 text-green-700'
                              : day.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {day.status === 'complete' ? 'Lengkap' : day.status === 'partial' ? 'Sebagian' : 'Belum'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat laporan...</div>
        </div>
      )}
    </div>
  );
}
