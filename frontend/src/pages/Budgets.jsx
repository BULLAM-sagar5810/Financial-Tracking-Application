import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { money, thisMonth } from '../utils/format';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

export default function Budgets() {
  const toast = useToast();
  const [month, setMonth] = useState(thisMonth());
  const [rows, setRows] = useState(null); const [cats, setCats] = useState([]);
  const [edit, setEdit] = useState(null); const [err, setErr] = useState('');

  const load = useCallback(() => api.get('/budgets/', { params: { month } }).then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e))), [month]);
  useEffect(() => { setRows(null); load(); }, [load]);
  useEffect(() => { api.get('/categories/', { params: { type: 'expense' } }).then((r) => setCats(r.data)); }, []);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!(Number(edit.amount) > 0)) return setErr('Enter an amount greater than 0');
    const body = { category: edit.category || null, amount: edit.amount, month: `${month}-01` };
    try {
      if (edit.id) await api.put(`/budgets/${edit.id}/`, body); else await api.post('/budgets/', body);
      toast.success('Budget saved'); setEdit(null); load();
    } catch (er) { setErr(errMsg(er)); }
  };
  const del = async (b) => { if (window.confirm('Delete this budget?')) { try { await api.delete(`/budgets/${b.id}/`); toast.success('Budget deleted'); load(); } catch (e) { toast.error(errMsg(e)); } } };
  const color = (s) => (s === 'exceeded' ? 'danger' : s === 'warning' ? 'warning' : 'success');

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">Budgets</h4>
        <div className="d-flex gap-2"><input type="month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn btn-primary text-nowrap" onClick={() => setEdit({ category: '', amount: '' })}><i className="bi bi-plus-lg me-1" />Add budget</button></div>
      </div>
      {!rows ? <Loader /> : rows.length === 0 ? <div className="card"><EmptyState icon="bi-piggy-bank" title="No budgets for this month" text="Create an overall monthly budget and category budgets." /></div> : (
        <div className="row g-3">{rows.map((b) => (
          <div className="col-md-6 col-xl-4" key={b.id}><div className="card h-100"><div className="card-body">
            <div className="d-flex justify-content-between"><h6>{b.category_name}</h6><span className={`badge bg-${color(b.status)}`}>{b.status}</span></div>
            <div className="progress my-2" style={{ height: 10 }}><div className={`progress-bar bg-${color(b.status)}`} style={{ width: `${Math.min(b.percent_used, 100)}%` }} /></div>
            <div className="small text-muted d-flex justify-content-between"><span>Spent {money(b.spent)} ({b.percent_used}%)</span><span>Budget {money(b.amount)}</span></div>
            <div className={`fw-semibold mt-1 ${b.remaining < 0 ? 'text-danger' : ''}`}>{b.remaining < 0 ? 'Over by ' : 'Remaining '}{money(Math.abs(b.remaining))}</div>
            <div className="mt-3 text-end"><button className="btn btn-sm btn-light me-1" onClick={() => setEdit({ id: b.id, category: b.category || '', amount: b.amount })}><i className="bi bi-pencil" /></button>
              <button className="btn btn-sm btn-light text-danger" onClick={() => del(b)}><i className="bi bi-trash" /></button></div>
          </div></div></div>))}</div>)}
      {edit && (
        <Modal title={edit.id ? 'Update budget' : 'New budget'} onClose={() => setEdit(null)}>
          <form onSubmit={save} noValidate>
            {err && <div className="alert alert-danger py-2">{err}</div>}
            <div className="mb-3"><label className="form-label">Category</label>
              <select className="form-select" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}><option value="">Overall monthly budget</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="mb-3"><label className="form-label">Amount (₹) for {month}</label><input type="number" min="0" step="0.01" className="form-control" value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value })} /></div>
            <div className="text-end"><button type="button" className="btn btn-light me-2" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary">Save</button></div>
          </form>
        </Modal>)}
    </>
  );
}
