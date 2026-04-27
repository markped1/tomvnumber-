import React, { useEffect, useState } from 'react';
import api from '../../api.js';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)); }, []);

  if (!stats) return <p style={{ color: '#16a34a' }}>Loading...</p>;

  const cards = [
    { label: 'Total Users',       value: stats.totalUsers,        icon: '👥' },
    { label: 'Active Numbers',    value: stats.activeNumbers,     icon: '📱' },
    { label: 'Total Numbers Sold',value: stats.totalNumbers,      icon: '🔢' },
    { label: 'Total Calls',       value: stats.totalCalls,        icon: '📞' },
    { label: 'Total SMS',         value: stats.totalSms,          icon: '💬' },
    { label: 'Total Revenue',     value: `$${stats.totalRevenue.toFixed(2)}`, icon: '💰' },
    { label: 'Balance Held',      value: `$${stats.totalBalanceHeld.toFixed(2)}`, icon: '🏦' },
  ];

  return (
    <div>
      <h2 style={s.heading}>Overview</h2>
      <div style={s.grid}>
        {cards.map(c => (
          <div key={c.label} style={s.card}>
            <span style={s.icon}>{c.icon}</span>
            <p style={s.value}>{c.value}</p>
            <p style={s.label}>{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  heading: { fontSize: 22, fontWeight: 700, color: '#166534', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  card: { background: '#ffffff', borderRadius: 12, padding: 20, border: '1px solid #bbf7d0', textAlign: 'center', boxShadow: '0 2px 8px rgba(22,163,74,0.07)' },
  icon: { fontSize: 28 },
  value: { fontSize: 28, fontWeight: 700, color: '#16a34a', margin: '8px 0 4px' },
  label: { fontSize: 12, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1 },
};
