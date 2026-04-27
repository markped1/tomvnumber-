import React, { useEffect, useState } from 'react';
import api from '../../api.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [balanceOp, setBalanceOp] = useState('increment');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => api.get('/admin/users').then(r => setUsers(r.data));

  const openUser = async (id) => {
    const { data } = await api.get(`/admin/users/${id}`);
    setSelected(data);
    setMsg('');
  };

  const adjustBalance = async () => {
    await api.patch(`/admin/users/${selected.id}/balance`, { amount: parseFloat(balanceInput), operation: balanceOp });
    setMsg('Balance updated');
    fetchUsers();
    openUser(selected.id);
    setBalanceInput('');
  };

  const changeRole = async (role) => {
    await api.patch(`/admin/users/${selected.id}/role`, { role });
    setMsg(`Role changed to ${role}`);
    fetchUsers();
    openUser(selected.id);
  };

  const resetPassword = async () => {
    await api.patch(`/admin/users/${selected.id}/password`, { newPassword });
    setMsg('Password reset');
    setNewPassword('');
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    await api.delete(`/admin/users/${id}`);
    setSelected(null);
    fetchUsers();
  };

  return (
    <div style={s.wrap}>
      {/* User list */}
      <div style={s.list}>
        <h2 style={s.heading}>Users ({users.length})</h2>
        {users.map(u => (
          <div key={u.id} style={{ ...s.row, background: selected?.id === u.id ? '#dcfce7' : '#fff' }} onClick={() => openUser(u.id)}>
            <div>
              <p style={s.email}>{u.email}</p>
              <p style={s.meta}>{u._count.numbers} numbers · {u._count.calls} calls · {u._count.messages} sms</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={s.balance}>${u.balance.toFixed(2)}</p>
              <span style={{ ...s.badge, background: u.role === 'admin' ? '#16a34a' : '#bbf7d0', color: u.role === 'admin' ? '#fff' : '#166534' }}>{u.role}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User detail */}
      {selected && (
        <div style={s.detail}>
          <h3 style={s.heading}>{selected.email}</h3>
          {msg && <p style={s.msg}>{msg}</p>}

          <div style={s.section}>
            <p style={s.sectionTitle}>Balance — current: <strong>${selected.balance.toFixed(2)}</strong></p>
            <div style={s.row2}>
              <select style={s.select} value={balanceOp} onChange={e => setBalanceOp(e.target.value)}>
                <option value="increment">Add</option>
                <option value="decrement">Subtract</option>
                <option value="set">Set to</option>
              </select>
              <input style={s.input} type="number" placeholder="Amount" value={balanceInput} onChange={e => setBalanceInput(e.target.value)} />
              <button style={s.btn} onClick={adjustBalance}>Apply</button>
            </div>
          </div>

          <div style={s.section}>
            <p style={s.sectionTitle}>Role — current: <strong>{selected.role}</strong></p>
            <div style={s.row2}>
              <button style={s.btn} onClick={() => changeRole('admin')}>Make Admin</button>
              <button style={{ ...s.btn, background: '#dcfce7', color: '#166534' }} onClick={() => changeRole('user')}>Make User</button>
            </div>
          </div>

          <div style={s.section}>
            <p style={s.sectionTitle}>Reset Password</p>
            <div style={s.row2}>
              <input style={s.input} type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <button style={s.btn} onClick={resetPassword}>Reset</button>
            </div>
          </div>

          <div style={s.section}>
            <p style={s.sectionTitle}>Numbers ({selected.numbers.length})</p>
            {selected.numbers.map(n => (
              <p key={n.id} style={s.item}>{n.number} — {n.active ? '✅ Active' : '❌ Inactive'} — expires {new Date(n.expiresAt).toLocaleDateString()}</p>
            ))}
          </div>

          <button style={{ ...s.btn, background: '#fee2e2', color: '#ef4444', marginTop: 16 }} onClick={() => deleteUser(selected.id)}>
            🗑 Delete User
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: 'flex', gap: 20 },
  list: { width: 340, flexShrink: 0 },
  detail: { flex: 1, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #bbf7d0' },
  heading: { fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 16 },
  row: { padding: '12px 16px', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  email: { fontWeight: 600, color: '#166534', fontSize: 14 },
  meta: { color: '#4ade80', fontSize: 12, marginTop: 2 },
  balance: { fontWeight: 700, color: '#16a34a', fontSize: 15 },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  section: { marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #dcfce7' },
  sectionTitle: { color: '#166534', fontSize: 13, marginBottom: 10 },
  row2: { display: 'flex', gap: 8 },
  select: { padding: '8px 10px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 13 },
  input: { flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontSize: 13 },
  btn: { padding: '8px 16px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  msg: { color: '#16a34a', fontWeight: 600, marginBottom: 12, fontSize: 13 },
  item: { fontSize: 13, color: '#166534', padding: '4px 0' },
};
