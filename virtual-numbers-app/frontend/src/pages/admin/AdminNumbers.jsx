import React, { useEffect, useState } from 'react';
import api from '../../api.js';

export default function AdminNumbers() {
  const [numbers, setNumbers] = useState([]);

  useEffect(() => { api.get('/admin/numbers').then(r => setNumbers(r.data)); }, []);

  const release = async (id) => {
    if (!confirm('Force-release this number?')) return;
    await api.delete(`/admin/numbers/${id}`);
    setNumbers(prev => prev.map(n => n.id === id ? { ...n, active: false } : n));
  };

  return (
    <div>
      <h2 style={s.heading}>All Numbers ({numbers.length})</h2>
      <div style={s.table}>
        <div style={s.header}>
          <span>Number</span><span>Owner</span><span>Country</span><span>Price</span><span>Expires</span><span>Status</span><span>Action</span>
        </div>
        {numbers.map(n => (
          <div key={n.id} style={s.row}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{n.number}</span>
            <span style={{ fontSize: 12 }}>{n.user.email}</span>
            <span>{n.country}</span>
            <span>${n.monthlyPrice}</span>
            <span>{new Date(n.expiresAt).toLocaleDateString()}</span>
            <span style={{ color: n.active ? '#16a34a' : '#ef4444' }}>{n.active ? 'Active' : 'Released'}</span>
            {n.active
              ? <button style={s.dangerBtn} onClick={() => release(n.id)}>Release</button>
              : <span style={{ color: '#4ade80', fontSize: 12 }}>—</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  heading: { fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 16 },
  table: { background: '#fff', borderRadius: 12, border: '1px solid #bbf7d0', overflow: 'hidden' },
  header: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr 1fr 1fr', padding: '12px 16px', background: '#16a34a', color: '#fff', fontSize: 12, textTransform: 'uppercase' },
  row: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid #bbf7d0', fontSize: 13, color: '#166534', alignItems: 'center' },
  dangerBtn: { padding: '4px 10px', borderRadius: 6, background: '#fee2e2', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontSize: 12 },
};
