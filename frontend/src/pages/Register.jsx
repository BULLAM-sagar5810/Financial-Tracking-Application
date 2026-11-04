import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../services/api';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate(); const toast = useToast();
  const [f, setF] = useState({ first_name: '', last_name: '', username: '', email: '', password: '', confirm: '' });
  const [e, setE] = useState({}); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value });
  const submit = async (ev) => {
    ev.preventDefault();
    const v = {};
    if (f.username.length < 3) v.username = 'At least 3 characters';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) v.email = 'Enter a valid email';
    if (f.password.length < 8) v.password = 'At least 8 characters';
    if (f.password !== f.confirm) v.confirm = 'Passwords do not match';
    setE(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try { const { confirm, ...body } = f; await register(body); toast.success('Account created!'); nav('/'); }
    catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };
  const field = (k, label, type = 'text') => (
    <div className="mb-3"><label className="form-label">{label}</label>
      <input type={type} className={`form-control ${e[k] ? 'is-invalid' : ''}`} value={f[k]} onChange={set(k)} /><div className="invalid-feedback">{e[k]}</div></div>);
  return (
    <div className="auth-wrap"><div className="card auth-card"><div className="card-body p-4">
      <h3 className="text-center mb-3">Create account</h3>
      <form onSubmit={submit} noValidate>
        <div className="row"><div className="col-6">{field('first_name', 'First name')}</div><div className="col-6">{field('last_name', 'Last name')}</div></div>
        {field('username', 'Username')}{field('email', 'Email', 'email')}{field('password', 'Password', 'password')}{field('confirm', 'Confirm password', 'password')}
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      </form>
      <p className="text-center mt-3 mb-0">Already registered? <Link to="/login">Login</Link></p>
    </div></div></div>
  );
}
