import React, { useEffect, useState } from 'react';
import api from '../../api.js';

export default function AdminLogs({ type }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get(`/admin/${type}`).then(r => setLogs(r.data));
  }, [type]);

  const isCalls = type === 'calls';

  return (
    <div>
      <h2 style={s.heading}>{isCalls ? 'All Calls' : 'All SMS'} ({logs.length})</h2>
      <div style={s.table}>
        <div style={{ ...s.row, ...s.header }}>
          <span>User</span>
          <span>Number</span>
          <span>Direction</span>
          <span>From</span>
          <span>To</span>
          {isCalls ? <span>Duration</span> : <span>Message</span>}
          <span>Status</span>
          <span>Date</span>
        </div>
        {logs.map(l => (
          <div key={l.id} style={s.row}>
            <span style={{ fontSize: 12 }}>{l.user.email}</span>
            <span style={{ color: '#16a34a', fontSize: 12 }}>{l.number.number}</span>
            <span style={{ color: l.direction === 'inbound' ? '#16a34a' : '#15803d' }}>
              {l.direction === 'inbound' ? '⬇' : '⬆'} {l.direction}
            </span>
            <span style={{ fontSize: 12 }}>{l.from}</span>
            <span style={{ fontSize: 12 }}>{l.to}</span>
            {isCalls
              ? <span>{l.duration}s</span>
              : <span style={s.msgBody}>{l.body}</span>
            }
            <span>{l.status}</span>
            <span style={{ fontSize: 11 }}>{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {logs.length === 0 && <p style={s.empty}>No records yet</p>}
      </div>
    </div>
  );
}

const s = {
  heading: { fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 16 },
  table: { background: '#fff', borderRadius: 12, border: '1px solid #bbf7d0', overflow: 'hidden' },
  header: { background: '#16a34a', color: '#fff', fontSize: 11, textTransform: 'uppercase' },
  row: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1.5fr 2fr 1fr 1.5fr', padding: '10px 14px', borderTop: '1px solid #bbf7d0', fontSize: 12, color: '#166534', alignItems: 'center' },
  msgBody: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { padding: 16, color: '#4ade80' },
};
