import { useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PAYMENT_METHODS, today } from '../utils/format';
import Modal from './Modal';

export default function TransactionForm({ initial, fixedType, onClose, onSaved }) {
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState({});
  const [f, setF] = useState(initial ? { ...initial } : { type: fixedType || 'expense', category: '', amount: '', description: '', payment_method: 'UPI', date: today() });

  useEffect(() => { api.get('/categories/', { params: { type: f.type } }).then((r) => setCats(r.data)); }, [f.type]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value, ...(k === 'type' ? { category: '' } : {}) });

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!f.category) v.category = 'Select a category';
    if (!(Number(f.amount) > 0)) v.amount = 'Enter an amount greater than 0';
    if (!f.date) v.date = 'Select a date';
    setErrs(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const body = { type: f.type, category: f.category, amount: f.amount, description: f.description, payment_method: f.payment_method, date: f.date };
      if (initial?.id) await api.put(`/transactions/${initial.id}/`, body); else await api.post('/transactions/', body);
      toast.success(initial?.id ? 'Transaction updated' : 'Transaction added');
      onSaved();
    } catch (er) { toast.error(errMsg(er)); } finally { setBusy(false); }
  };

  const fe = (k) => errs[k] && <div className="text-danger small">{errs[k]}</div>;
  return (
    <Modal title={`${initial?.id ? 'Edit' : 'Add'} ${f.type === 'income' ? 'Income' : 'Expense'}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {!fixedType && (
          <div className="mb-3"><label className="form-label">Type</label>
            <select className="form-select" value={f.type} onChange={set('type')}><option value="expense">Expense</option><option value="income">Income</option></select></div>)}
        <div className="row">
          <div className="col-6 mb-3"><label className="form-label">Category</label>
            <select className="form-select" value={f.category} onChange={set('category')}><option value="">Select…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{fe('category')}</div>
          <div className="col-6 mb-3"><label className="form-label">Amount (₹)</label>
            <input type="number" step="0.01" min="0" className="form-control" value={f.amount} onChange={set('amount')} />{fe('amount')}</div>
          <div className="col-6 mb-3"><label className="form-label">Date</label>
            <input type="date" className="form-control" value={f.date} onChange={set('date')} />{fe('date')}</div>
          <div className="col-6 mb-3"><label className="form-label">Payment method</label>
            <select className="form-select" value={f.payment_method} onChange={set('payment_method')}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
        </div>
        <div className="mb-3"><label className="form-label">Description</label><input className="form-control" maxLength={255} value={f.description} onChange={set('description')} /></div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
