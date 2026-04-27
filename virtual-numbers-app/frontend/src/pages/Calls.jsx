import React, { useEffect, useState, useRef } from 'react';
import api from '../api.js';

export default function Calls() {
  const [numbers, setNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [dialTo, setDialTo] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // idle | connecting | active | ended
  const [history, setHistory] = useState([]);
  const [device, setDevice] = useState(null);
  const activeCall = useRef(null);

  useEffect(() => {
    api.get('/numbers').then(r => {
      const active = r.data.filter(n => n.active);
      setNumbers(active);
      if (active.length) setSelectedNumber(active[0].id);
    });
    api.get('/calls/history').then(r => setHistory(r.data));
  }, []);

  const makeCall = async () => {
    if (!dialTo || !selectedNumber) return;
    setCallStatus('connecting');
    try {
      await api.post('/calls/outbound', { to: dialTo, fromNumberId: selectedNumber });
      setCallStatus('active');
    } catch (e) {
      alert('Call failed: ' + (e.response?.data?.error || e.message));
      setCallStatus('idle');
    }
  };

  const hangUp = () => {
    setCallStatus('idle');
  };

  const acceptIncoming = () => {
    setCallStatus('active');
  };

  return (
    <div>
      <h2 style={s.heading}>Calls</h2>

      <div style={s.grid}>
        {/* Dialer */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Make a Call</h3>
          <select style={s.select} value={selectedNumber} onChange={e => setSelectedNumber(e.target.value)}>
            {numbers.map(n => <option key={n.id} value={n.id}>{n.number}</option>)}
          </select>
          <input
            style={s.input}
            placeholder="Enter number to call (e.g. +12125551234)"
            value={dialTo}
            onChange={e => setDialTo(e.target.value)}
          />

          {callStatus === 'idle' && (
            <button style={s.callBtn} onClick={makeCall} disabled={!device}>📞 Call</button>
          )}
          {callStatus === 'connecting' && <p style={s.status}>Connecting...</p>}
          {callStatus === 'active' && (
            <button style={s.hangupBtn} onClick={hangUp}>🔴 Hang Up</button>
          )}
          {callStatus === 'incoming' && (
            <div style={s.row}>
              <button style={s.callBtn} onClick={acceptIncoming}>✅ Accept</button>
              <button style={s.hangupBtn} onClick={hangUp}>❌ Decline</button>
            </div>
          )}
          {callStatus === 'ended' && <p style={s.status}>Call ended</p>}
        </div>
      </div>

      <h3 style={{ ...s.heading, fontSize: 18, marginTop: 32 }}>Call History</h3>
      <div style={s.table}>
        <div style={s.tableHeader}>
          <span>Direction</span><span>From</span><span>To</span><span>Duration</span><span>Status</span><span>Date</span>
        </div>
        {history.length === 0 && <p style={s.empty}>No calls yet</p>}
        {history.map(c => (
          <div key={c.id} style={s.tableRow}>
            <span style={{ color: c.direction === 'inbound' ? '#16a34a' : '#15803d' }}>
              {c.direction === 'inbound' ? '⬇ Inbound' : '⬆ Outbound'}
            </span>
            <span>{c.from}</span>
            <span>{c.to}</span>
            <span>{c.duration}s</span>
            <span>{c.status}</span>
            <span>{new Date(c.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#166534' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
  card: { background: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 12px rgba(22,163,74,0.07)' },
  cardTitle: { color: '#16a34a', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  select: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  callBtn: { padding: '12px', borderRadius: 8, background: '#16a34a', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
  hangupBtn: { padding: '12px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
  status: { color: '#16a34a', textAlign: 'center' },
  row: { display: 'flex', gap: 8 },
  table: { background: '#ffffff', borderRadius: 12, border: '1px solid #bbf7d0', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', padding: '12px 16px', background: '#16a34a', color: '#ffffff', fontSize: 12, textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', padding: '14px 16px', borderTop: '1px solid #bbf7d0', fontSize: 13, color: '#166534' },
  empty: { padding: 16, color: '#4ade80' },
};
