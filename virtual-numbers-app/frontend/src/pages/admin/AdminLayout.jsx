import React from 'react';
import { Link, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../App.jsx';

export default function AdminLayout() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" />;

  return (
    <div style={s.wrap}>
      <aside style={s.sidebar}>
        <p style={s.sideTitle}>
          <span style={{ color: '#fff' }}>Tom</span>
          <span style={{ border: '1.5px solid #fff', borderRadius: 3, padding: '0 3px', margin: '0 1px', color: '#fff' }}>V</span>
          <span style={{ color: '#fff' }}>Number</span>
          {' '}Admin
        </p>
        <nav style={s.nav}>
          <Link to="/admin" style={s.link}>📊 Overview</Link>
          <Link to="/admin/users" style={s.link}>👥 Users</Link>
          <Link to="/admin/numbers" style={s.link}>📱 Numbers</Link>
          <Link to="/admin/calls" style={s.link}>📞 Calls</Link>
          <Link to="/admin/sms" style={s.link}>💬 SMS</Link>
        </nav>
      </aside>
      <div style={s.content}>
        <Outlet />
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', minHeight: 'calc(100vh - 52px)', gap: 0 },
  sidebar: { width: 200, background: '#15803d', padding: '24px 0', flexShrink: 0 },
  sideTitle: { color: '#dcfce7', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, padding: '0 20px 16px' },
  nav: { display: 'flex', flexDirection: 'column' },
  link: { color: '#ffffff', textDecoration: 'none', padding: '10px 20px', fontSize: 14, display: 'block' },
  content: { flex: 1, padding: 28, background: '#f0fdf4', overflowY: 'auto' },
};
