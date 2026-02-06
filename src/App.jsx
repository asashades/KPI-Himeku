import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HostLive from './pages/HostLive';
import Warehouse from './pages/Warehouse';
import Crewstore from './pages/Crewstore';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Presensi from './pages/Presensi';
import ContentCreator from './pages/ContentCreator';
import SlipGaji from './pages/SlipGaji';
import RekapPresensi from './pages/RekapPresensi';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token and get user
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setUser(data);
          } else {
            setToken(null);
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setLoading(false);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // Show loading while verifying token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hostlive" element={<HostLive user={user} />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/crewstore" element={<Crewstore />} />
          <Route path="/contentcreator" element={<ContentCreator user={user} />} />
          <Route path="/presensi" element={<Presensi user={user} />} />
          <Route path="/rekap-presensi" element={<RekapPresensi user={user} />} />
          <Route path="/slipgaji" element={<SlipGaji user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
