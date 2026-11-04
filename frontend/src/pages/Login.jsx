import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate(); const toast = useToast();
  const [f, setF] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (!f.username || !f.password) return setErr('Enter username and password');
    setBusy(true); setErr('');
    try { await login(f.username, f.password); toast.success('Welcome back!'); nav('/'); }
    catch (er) { setErr(er.response?.status === 401 ? 'Invalid username or password' : errMsg(er)); }
    finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap"><div className="card auth-card"><div className="card-body p-4 p-md-5">
      <div className="text-center mb-4"><i className="bi bi-wallet2 fs-1 text-primary" /><h3 className="mt-2">FinTrack</h3><p className="text-muted">Sign in to your account</p></div>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <form onSubmit={submit} noValidate>
        <div className="mb-3"><label className="form-label">Username</label><input className="form-control" autoFocus value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
        <div className="mb-2"><label className="form-label">Password</label><input type="password" className="form-control" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <div className="text-end mb-3"><Link to="/forgot-password" className="small">Forgot password?</Link></div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
      </form>
      <p className="text-center mt-3 mb-0">No account? <Link to="/register">Register</Link></p>
      <p className="text-center text-muted small mt-2 mb-0">Demo: <code>demo</code> / <code>Demo@12345</code> (after running <code>seed_demo</code>)</p>
    </div></div></div>
  );
}
