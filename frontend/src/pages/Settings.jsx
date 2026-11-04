import { useState } from 'react';
import api, { errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const toast = useToast();
  const [p, setP] = useState({ old_password: '', new_password: '', confirm: '' });
  const change = async (e) => {
    e.preventDefault();
    if (p.new_password !== p.confirm) return toast.error('New passwords do not match');
    try { await api.post('/auth/change-password/', { old_password: p.old_password, new_password: p.new_password }); toast.success('Password changed'); setP({ old_password: '', new_password: '', confirm: '' }); }
    catch (er) { toast.error(errMsg(er)); }
  };
  const demo = async () => { try { const { data } = await api.post('/demo-data/'); toast.success(`Added ${data.created} demo transactions`); } catch (er) { toast.error(errMsg(er)); } };
  const inp = (k, label) => (<div className="mb-3"><label className="form-label">{label}</label><input type="password" className="form-control" value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} /></div>);
  return (
    <div className="row g-3" style={{ maxWidth: 900 }}>
      <div className="col-md-6"><div className="card"><div className="card-body"><h5>Change password</h5>
        <form onSubmit={change}>{inp('old_password', 'Current password')}{inp('new_password', 'New password')}{inp('confirm', 'Confirm new password')}<button className="btn btn-primary">Update password</button></form></div></div></div>
      <div className="col-md-6"><div className="card"><div className="card-body"><h5>Sample data</h5>
        <p className="text-muted">Populate an empty account with 6 months of realistic transactions and budgets so you can explore the dashboard and reports.</p>
        <button className="btn btn-outline-primary" onClick={demo}><i className="bi bi-database-add me-1" />Load demo data</button></div></div></div>
    </div>
  );
}
