import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, { email, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.title}>
          <span style={s.titleGreen}>Tom</span>
          <span style={s.titleV}>V</span>
          <span style={s.titleGreen}>Number</span>
        </h1>
        <p style={s.sub}>Virtual phone numbers for calls & SMS</p>
        <div style={s.tabs}>
          <button style={mode === 'login' ? s.tabActive : s.tab} onClick={() => setMode('login')}>Login</button>
          <button style={mode === 'register' ? s.tabActive : s.tab} onClick={() => setMode('register')}>Register</button>
        </div>
        <form onSubmit={submit} style={s.form}>
          <input style={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' },
  card: { background: '#ffffff', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400, border: '1px solid #bbf7d0', boxShadow: '0 4px 24px rgba(22,163,74,0.08)' },
  title: { textAlign: 'center', marginBottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, fontSize: 28 },
  titleGreen: { color: '#16a34a', fontWeight: 800 },
  titleV: {
    color: '#16a34a',
    fontWeight: 900,
    fontSize: 30,
    border: '2.5px solid #16a34a',
    borderRadius: 5,
    padding: '0 4px',
    margin: '0 2px',
    lineHeight: 1.1,
    display: 'inline-block',
  },
  sub: { textAlign: 'center', color: '#4ade80', fontSize: 14, marginBottom: 24 },
  tabs: { display: 'flex', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #bbf7d0' },
  tab: { flex: 1, padding: '10px', background: 'transparent', color: '#16a34a', border: 'none', cursor: 'pointer', fontSize: 14 },
  tabActive: { flex: 1, padding: '10px', background: '#16a34a', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 14 },
  error: { color: '#ef4444', fontSize: 13 },
  btn: { padding: '12px', borderRadius: 8, background: '#16a34a', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
};
