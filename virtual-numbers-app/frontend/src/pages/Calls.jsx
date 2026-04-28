import React, { useEffect, useState, useRef } from 'react';
import { TelnyxRTC } from '@telnyx/webrtc';
import api from '../api.js';

export default function Calls() {
  const [numbers, setNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [dialTo, setDialTo] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // idle | connecting | active | incoming | ended
  const [history, setHistory] = useState([]);
  const [clientReady, setClientReady] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const clientRef = useRef(null);
  const callRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    api.get('/numbers').then(r => {
      const active = r.data.filter(n => n.active);
      setNumbers(active);
      if (active.length) setSelectedNumber(active[0].id);
    });
    api.get('/calls/history').then(r => setHistory(r.data));
    initWebRTC();

    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  const initWebRTC = async () => {
    try {
      const { data } = await api.get('/calls/token');
      const client = new TelnyxRTC({
        login: data.login,
        password: data.password,
      });

      client.on('telnyx.ready', () => setClientReady(true));
      client.on('telnyx.error', e => console.error('WebRTC error:', e));

      client.on('telnyx.notification', notification => {
        const call = notification.call;
        if (!call) return;

        if (notification.type === 'callUpdate') {
          if (call.state === 'ringing') {
            setIncomingCall(call);
            setCallStatus('incoming');
          }
          if (call.state === 'active') {
            setCallStatus('active');
            // attach audio stream
            if (audioRef.current) {
              audioRef.current.srcObject = call.remoteStream;
              audioRef.current.play().catch(() => {});
            }
          }
          if (call.state === 'hangup' || call.state === 'destroy') {
            setCallStatus('ended');
            setIncomingCall(null);
            callRef.current = null;
            setTimeout(() => setCallStatus('idle'), 2000);
          }
        }
      });

      client.connect();
      clientRef.current = client;
    } catch (e) {
      console.error('WebRTC init failed:', e);
    }
  };

  const makeCall = async () => {
    if (!dialTo || !selectedNumber || !clientRef.current) return;
    const number = numbers.find(n => n.id === selectedNumber);
    setCallStatus('connecting');
    try {
      const call = clientRef.current.newCall({
        destinationNumber: dialTo,
        callerNumber: number?.number || '',
      });
      callRef.current = call;
    } catch (e) {
      alert('Call failed: ' + e.message);
      setCallStatus('idle');
    }
  };

  const hangUp = () => {
    callRef.current?.hangup();
    incomingCall?.hangup();
    setCallStatus('idle');
    setIncomingCall(null);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    incomingCall.answer();
    callRef.current = incomingCall;
    setCallStatus('active');
  };

  return (
    <div>
      <h2 style={s.heading}>Calls</h2>

      {/* Hidden audio element for call audio */}
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      <div style={s.grid}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>Make a Call</h3>

          {!clientReady && (
            <p style={s.notice}>⏳ Connecting to voice service...</p>
          )}

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
            <button style={s.callBtn} onClick={makeCall} disabled={!clientReady}>
              📞 {clientReady ? 'Call' : 'Connecting...'}
            </button>
          )}
          {callStatus === 'connecting' && <p style={s.status}>⏳ Connecting...</p>}
          {callStatus === 'active' && (
            <div>
              <p style={{ ...s.status, color: '#16a34a' }}>🟢 Call Active</p>
              <button style={s.hangupBtn} onClick={hangUp}>🔴 Hang Up</button>
            </div>
          )}
          {callStatus === 'incoming' && (
            <div>
              <p style={{ ...s.status, color: '#16a34a' }}>📲 Incoming call...</p>
              <div style={s.row}>
                <button style={s.callBtn} onClick={acceptCall}>✅ Accept</button>
                <button style={s.hangupBtn} onClick={hangUp}>❌ Decline</button>
              </div>
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
  card: { background: '#ffffff', borderRadius: 12, padding: 24, border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 12px rgba(22,163,74,0.07)', maxWidth: 420 },
  cardTitle: { color: '#16a34a', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  notice: { color: '#4ade80', fontSize: 13 },
  select: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  callBtn: { padding: '12px', borderRadius: 8, background: '#16a34a', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15, width: '100%' },
  hangupBtn: { padding: '12px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15, width: '100%', marginTop: 8 },
  status: { color: '#166534', textAlign: 'center', fontSize: 14 },
  row: { display: 'flex', gap: 8 },
  table: { background: '#ffffff', borderRadius: 12, border: '1px solid #bbf7d0', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', padding: '12px 16px', background: '#16a34a', color: '#ffffff', fontSize: 12, textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', padding: '14px 16px', borderTop: '1px solid #bbf7d0', fontSize: 13, color: '#166534' },
  empty: { padding: 16, color: '#4ade80' },
};
