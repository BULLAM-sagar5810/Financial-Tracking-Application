import { useState } from 'react';
import api, { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user, setUser } = useAuth(); const toast = useToast();
  const [f, setF] = useState({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone || '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error('Enter a valid email');
    setBusy(true);
    try { const { data } = await api.put('/auth/profile/', f); setUser(data); toast.success('Profile updated'); } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const inp = (k, label, type = 'text') => (<div className="mb-3"><label className="form-label">{label}</label><input type={type} className="form-control" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>);
  return (
    <div className="card" style={{ maxWidth: 600 }}><div className="card-body">
      <h4>My Profile</h4><p className="text-muted">Username: <strong>{user.username}</strong> · Member since {new Date(user.date_joined).toLocaleDateString()}</p>
      <form onSubmit={submit} noValidate><div className="row"><div className="col-6">{inp('first_name', 'First name')}</div><div className="col-6">{inp('last_name', 'Last name')}</div></div>
        {inp('email', 'Email', 'email')}{inp('phone', 'Phone')}<button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></form>
    </div></div>
  );
}
