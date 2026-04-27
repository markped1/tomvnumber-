import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../App.jsx';

const COUNTRIES = [
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'SE', name: '🇸🇪 Sweden' },
  { code: 'NO', name: '🇳🇴 Norway' },
  { code: 'DK', name: '🇩🇰 Denmark' },
  { code: 'PL', name: '🇵🇱 Poland' },
  { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'IT', name: '🇮🇹 Italy' },
  { code: 'CH', name: '🇨🇭 Switzerland' },
  { code: 'AT', name: '🇦🇹 Austria' },
  { code: 'BE', name: '🇧🇪 Belgium' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'CZ', name: '🇨🇿 Czech Republic' },
  { code: 'HU', name: '🇭🇺 Hungary' },
  { code: 'RO', name: '🇷🇴 Romania' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'MX', name: '🇲🇽 Mexico' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'ZA', name: '🇿🇦 South Africa' },
  { code: 'IL', name: '🇮🇱 Israel' },
  { code: 'JP', name: '🇯🇵 Japan' },
  { code: 'HK', name: '🇭🇰 Hong Kong' },
  { code: 'SG', name: '🇸🇬 Singapore' },
];

export default function BuyNumber() {
  const [country, setCountry] = useState('US');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState('');
  const { updateBalance } = useAuth();
  const navigate = useNavigate();

  // Auto-search when country changes
  useEffect(() => {
    search(country);
  }, [country]);

  const search = async (selectedCountry) => {
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const { data } = await api.get('/numbers/search', { params: { country: selectedCountry } });
      setResults(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const purchase = async (phoneNumber) => {
    setPurchasing(phoneNumber);
    try {
      await api.post('/numbers/purchase', { phoneNumber, country });
      const { data } = await api.get('/payments/balance');
      updateBalance(data.balance);
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div>
      <h2 style={s.heading}>Buy a Virtual Number</h2>
      <p style={s.sub}>Numbers include voice calls and SMS. $5.00/month per number.</p>

      <div style={s.searchBox}>
        <select style={s.select} value={country} onChange={e => setCountry(e.target.value)}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {searching && (
        <div style={s.loadingWrap}>
          <p style={s.loading}>🔍 Loading available numbers...</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div style={s.results}>
          <p style={s.resultCount}>{results.length} numbers available in {COUNTRIES.find(c => c.code === country)?.name}</p>
          {results.map(n => (
            <div key={n.phoneNumber} style={s.resultRow}>
              <div>
                <p style={s.number}>{n.phoneNumber}</p>
                <p style={s.region}>📍 {n.region} · Voice & SMS</p>
              </div>
              <div style={s.right}>
                <span style={s.price}>${n.monthlyPrice}/mo</span>
                <button
                  style={s.buyBtn}
                  onClick={() => purchase(n.phoneNumber)}
                  disabled={purchasing === n.phoneNumber}
                >
                  {purchasing === n.phoneNumber ? 'Purchasing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && results.length === 0 && !error && (
        <p style={s.empty}>No numbers available for this country right now.</p>
      )}
    </div>
  );
}

const s = {
  heading: { fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#166534' },
  sub: { color: '#16a34a', marginBottom: 24, fontSize: 14 },
  searchBox: { marginBottom: 24 },
  select: { padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#ffffff', color: '#166534', fontSize: 14, minWidth: 220 },
  error: { color: '#ef4444', marginBottom: 16 },
  loadingWrap: { padding: '40px 0', textAlign: 'center' },
  loading: { color: '#16a34a', fontSize: 15 },
  resultCount: { color: '#4ade80', fontSize: 13, marginBottom: 12 },
  results: { display: 'flex', flexDirection: 'column', gap: 8 },
  resultRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderRadius: 10, padding: '16px 20px', border: '1px solid #bbf7d0', boxShadow: '0 1px 6px rgba(22,163,74,0.06)' },
  number: { fontWeight: 700, color: '#166534', fontSize: 17, letterSpacing: 1 },
  region: { color: '#4ade80', fontSize: 13, marginTop: 4 },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  price: { color: '#166534', fontWeight: 700, fontSize: 15 },
  buyBtn: { padding: '10px 24px', borderRadius: 8, background: '#16a34a', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  empty: { color: '#4ade80', fontSize: 15, marginTop: 20 },
};
