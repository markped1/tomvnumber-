import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BuyNumber from './pages/BuyNumber.jsx';
import Calls from './pages/Calls.jsx';
import Messages from './pages/Messages.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminNumbers from './pages/admin/AdminNumbers.jsx';
import AdminLogs from './pages/admin/AdminLogs.jsx';

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>
        <span style={styles.brandGreen}>Tom</span>
        <span style={styles.brandV}>V</span>
        <span style={styles.brandGreen}>Number</span>
      </span>
      <div style={styles.navLinks}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        <Link to="/buy" style={styles.link}>Buy Number</Link>
        <Link to="/calls" style={styles.link}>Calls</Link>
        <Link to="/messages" style={styles.link}>SMS</Link>
        {user.role === 'admin' && <Link to="/admin" style={{ ...styles.link, color: '#fef08a', fontWeight: 700 }}>⚙ Admin</Link>}
      </div>
      <div style={styles.navRight}>
        <span style={styles.balance}>💰 ${user.balance?.toFixed(2)}</span>
        <button onClick={() => { logout(); navigate('/login'); }} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateBalance = (balance) => {
    const updated = { ...user, balance };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateBalance }}>
      <BrowserRouter>
        <NavBar />
        <main style={styles.main}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/buy" element={<PrivateRoute><BuyNumber /></PrivateRoute>} />
            <Route path="/calls" element={<PrivateRoute><Calls /></PrivateRoute>} />
            <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="numbers" element={<AdminNumbers />} />
              <Route path="calls" element={<AdminLogs type="calls" />} />
              <Route path="sms" element={<AdminLogs type="sms" />} />
            </Route>
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

const styles = {
  nav: { display: 'flex', alignItems: 'center', padding: '12px 24px', background: '#16a34a', borderBottom: '1px solid #15803d', gap: 24 },
  brand: { fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0 },
  brandGreen: { color: '#ffffff' },
  brandV: {
    color: '#ffffff',
    WebkitTextStroke: '1.5px #16a34a',
    textShadow: '0 0 0 #fff',
    background: '#ffffff',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    border: '2px solid #ffffff',
    borderRadius: 4,
    padding: '0 3px',
    margin: '0 1px',
    lineHeight: 1,
    fontSize: 22,
    fontWeight: 900,
  },
  navLinks: { display: 'flex', gap: 16, flex: 1 },
  link: { color: '#dcfce7', textDecoration: 'none', fontSize: 14 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  balance: { color: '#ffffff', fontWeight: 600, fontSize: 14 },
  logoutBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  main: { padding: 24, maxWidth: 1100, margin: '0 auto' },
};
