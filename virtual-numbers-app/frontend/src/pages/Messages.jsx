import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function Messages() {
  const [numbers, setNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/numbers').then(r => {
      const active = r.data.filter(n => n.active);
      setNumbers(active);
      if (active.length) setSelectedNumber(active[0].id);
    });
    api.get('/sms/history').then(r => setHistory(r.data));
  }, []);

  const sendSms = async (e) => {
    e.preventDefault();
    if (!to || !body || !selectedNumber) return;
    setSending(true);
    setError('');
    try {
      await api.post('/sms/send', { to, body, fromNumberId: selectedNumber });
      setBody('');
      const { data } = await api.get('/sms/history');
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 style={s.heading}>SMS Messages</h2>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Send a Message</h3>
        <form onSubmit={sendSms} style={s.form}>
          <select style={s.select} value={selectedNumber} onChange={e => setSelectedNumber(e.target.value)}>
            {numbers.map(n => <option key={n.id} value={n.id}>{n.number}</option>)}
          </select>
          <input
            style={s.input}
            placeholder="Recipient number (e.g. +12125551234)"
            value={to}
            onChange={e => setTo(e.target.value)}
            required
          />
          <textarea
            style={s.textarea}
            placeholder="Message body..."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            required
          />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={sending}>
            {sending ? 'Sending...' : '📤 Send SMS'}
          </button>
        </form>
      </div>

      <h3 style={{ ...s.heading, fontSize: 18, marginTop: 32 }}>Message History</h3>
      <div style={s.table}>
        <div style={s.tableHeader}>
          <span>Direction</span><span>From</span><span>To</span><span>Message</span><span>Status</span><span>Date</span>
        </div>
        {history.length === 0 && <p style={s.empty}>No messages yet</p>}
        {history.map(m => (
          <div key={m.id} style={s.tableRow}>
            <span style={{ color: m.direction === 'inbound' ? '#16a34a' : '#15803d' }}>
              {m.direction === 'inbound' ? '⬇ In' : '⬆ Out'}
            </span>
            <span>{m.from}</span>
            <span>{m.to}</span>
            <span style={s.msgBody}>{m.body}</span>
            <span>{m.status}</span>
            <span>{new Date(m.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 20, color: '#166534' },
  card: { background: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #bbf7d0', maxWidth: 600, boxShadow: '0 2px 12px rgba(22,163,74,0.07)' },
  cardTitle: { color: '#16a34a', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  select: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  textarea: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14, resize: 'vertical' },
  error: { color: '#ef4444', fontSize: 13 },
  btn: { padding: '12px', borderRadius: 8, background: '#16a34a', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
  table: { background: '#ffffff', borderRadius: 12, border: '1px solid #bbf7d0', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 3fr 1fr 2fr', padding: '12px 16px', background: '#16a34a', color: '#ffffff', fontSize: 12, textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr 3fr 1fr 2fr', padding: '14px 16px', borderTop: '1px solid #bbf7d0', fontSize: 13, alignItems: 'start', color: '#166534' },
  msgBody: { color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { padding: 16, color: '#4ade80' },
};
