import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email');
    try { const { data } = await api.post('/auth/forgot-password/', { email }); setMsg(data.detail); } catch (er) { setErr(errMsg(er)); }
  };
  return (
    <div className="auth-wrap"><div className="card auth-card"><div className="card-body p-4">
      <h4 className="mb-3">Forgot password</h4>
      {msg && <div className="alert alert-success py-2">{msg}</div>}{err && <div className="alert alert-danger py-2">{err}</div>}
      <form onSubmit={submit} noValidate><input className="form-control mb-3" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn btn-primary w-100">Send reset link</button></form>
      <p className="text-center mt-3 mb-0"><Link to="/login">Back to login</Link></p>
    </div></div></div>
  );
}
