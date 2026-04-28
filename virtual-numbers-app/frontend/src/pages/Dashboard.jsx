import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';

export default function Dashboard() {
  const { user, updateBalance } = useAuth();
  const [numbers, setNumbers] = useState([]);
  const [topupAmount, setTopupAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [forwardingNumber, setForwardingNumber] = useState('');
  const [forwardingSaved, setForwardingSaved] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchNumbers();
    fetchBalance();
    fetchProfile();
    if (searchParams.get('topup') === 'success') {
      setTimeout(fetchBalance, 2000);
    }
  }, []);

  const fetchNumbers = async () => {
    const { data } = await api.get('/numbers');
    setNumbers(data);
  };

  const fetchBalance = async () => {
    const { data } = await api.get('/payments/balance');
    updateBalance(data.balance);
  };

  const fetchProfile = async () => {
    const { data } = await api.get('/profile');
    setForwardingNumber(data.forwardingNumber || '');
  };

  const saveForwarding = async () => {
    await api.patch('/profile/forwarding', { forwardingNumber });
    setForwardingSaved(true);
    setTimeout(() => setForwardingSaved(false), 3000);
  };

  const handleTopup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/topup', { amount: topupAmount });
      window.location.href = data.url;
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const releaseNumber = async (id) => {
    if (!confirm('Release this number? This cannot be undone.')) return;
    await api.delete(`/numbers/${id}`);
    fetchNumbers();
  };

  return (
    <div>
      <h2 style={s.heading}>Dashboard</h2>

      <div style={s.grid}>
        {/* Balance card */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Account Balance</h3>
          <p style={s.bigNum}>${user?.balance?.toFixed(2)}</p>
          <div style={s.row}>
            <select style={s.select} value={topupAmount} onChange={e => setTopupAmount(Number(e.target.value))}>
              {[5, 10, 20, 50, 100].map(v => <option key={v} value={v}>${v}</option>)}
            </select>
            <button style={s.btn} onClick={handleTopup} disabled={loading}>
              {loading ? 'Redirecting...' : 'Top Up'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Your Numbers</h3>
          <p style={s.bigNum}>{numbers.filter(n => n.active).length}</p>
          <Link to="/buy" style={s.linkBtn}>+ Buy New Number</Link>
        </div>

        {/* Call Forwarding */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>📲 Call Forwarding</h3>
          <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 8 }}>
            Inbound calls will ring your real phone number
          </p>
          <input
            style={s.select}
            placeholder="e.g. +2348012345678"
            value={forwardingNumber}
            onChange={e => setForwardingNumber(e.target.value)}
          />
          <button style={{ ...s.btn, marginTop: 8 }} onClick={saveForwarding}>
            {forwardingSaved ? '✅ Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <h3 style={{ ...s.heading, fontSize: 18, marginTop: 32 }}>Active Numbers</h3>
      {numbers.length === 0 ? (
        <p style={s.empty}>No numbers yet. <Link to="/buy" style={{ color: '#16a34a' }}>Buy your first number</Link></p>
      ) : (
        <div style={s.table}>
          <div style={s.tableHeader}>
            <span>Number</span><span>Country</span><span>Expires</span><span>Status</span><span>Actions</span>
          </div>
          {numbers.map(n => (
            <div key={n.id} style={s.tableRow}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>{n.number}</span>
              <span>{n.country}</span>
              <span>{new Date(n.expiresAt).toLocaleDateString()}</span>
              <span style={{ color: n.active ? '#4ade80' : '#f87171' }}>{n.active ? 'Active' : 'Inactive'}</span>
              <button onClick={() => releaseNumber(n.id)} style={s.dangerBtn}>Release</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#166534' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 },
  card: { background: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #bbf7d0', boxShadow: '0 2px 12px rgba(22,163,74,0.07)' },
  cardTitle: { color: '#16a34a', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  bigNum: { fontSize: 36, fontWeight: 700, color: '#166534', marginBottom: 16 },
  row: { display: 'flex', gap: 8 },
  select: { flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  btn: { padding: '8px 16px', borderRadius: 8, background: '#16a34a', color: '#ffffff', border: 'none', fontWeight: 600, cursor: 'pointer' },
  linkBtn: { display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: '#dcfce7', color: '#166534', textDecoration: 'none', fontSize: 14 },
  empty: { color: '#4ade80', fontSize: 15 },
  table: { background: '#ffffff', borderRadius: 12, border: '1px solid #bbf7d0', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 16px', background: '#16a34a', color: '#ffffff', fontSize: 12, textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 16px', borderTop: '1px solid #bbf7d0', alignItems: 'center', fontSize: 14, color: '#166534' },
  dangerBtn: { padding: '4px 10px', borderRadius: 6, background: '#fee2e2', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer', fontSize: 12 },
};
