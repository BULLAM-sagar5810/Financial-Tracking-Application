import { useCallback, useEffect, useState } from 'react';
import api, { downloadCsv, errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { fmtDate, money, PAYMENT_METHODS } from '../utils/format';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import TransactionForm from '../components/TransactionForm';

const TITLES = { income: 'Income', expense: 'Expenses', undefined: 'All Transactions' };

export default function TransactionsPage({ type }) {
  const toast = useToast();
  const [rows, setRows] = useState(null); const [cats, setCats] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', payment_method: '', date_from: '', date_to: '', ordering: '-date', type: '' });
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    if (type) params.type = type;
    api.get('/transactions/', { params }).then((r) => setRows(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [filters, type]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get('/categories/', { params: type ? { type } : {} }).then((r) => setCats(r.data)); }, [type]);

  const del = async (r) => {
    if (!window.confirm('Delete this transaction?')) return;
    try { await api.delete(`/transactions/${r.id}/`); toast.success('Deleted'); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const total = (rows || []).reduce((s, r) => s + (r.type === 'income' ? 1 : -1) * Number(r.amount), 0);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">{TITLES[type]}</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => downloadCsv({ ...(type ? { type } : {}), ...(filters.date_from && { date_from: filters.date_from }), ...(filters.date_to && { date_to: filters.date_to }) }).catch((e) => toast.error(errMsg(e)))}><i className="bi bi-download me-1" />CSV</button>
          <button className="btn btn-primary" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-1" />Add {type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Transaction'}</button>
        </div>
      </div>
      <div className="card mb-3"><div className="card-body"><div className="row g-2">
        <div className="col-md-3"><input className="form-control" placeholder="Search…" value={filters.search} onChange={setF('search')} /></div>
        {!type && <div className="col-md-2"><select className="form-select" value={filters.type} onChange={setF('type')}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select></div>}
        <div className="col-md-2"><select className="form-select" value={filters.category} onChange={setF('category')}><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="col-md-2"><select className="form-select" value={filters.payment_method} onChange={setF('payment_method')}><option value="">Any payment</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
        <div className="col-6 col-md-2"><input type="date" className="form-control" value={filters.date_from} onChange={setF('date_from')} title="From" /></div>
        <div className="col-6 col-md-2"><input type="date" className="form-control" value={filters.date_to} onChange={setF('date_to')} title="To" /></div>
        <div className="col-md-2"><select className="form-select" value={filters.ordering} onChange={setF('ordering')}><option value="-date">Newest</option><option value="date">Oldest</option><option value="-amount">Amount ↓</option><option value="amount">Amount ↑</option></select></div>
      </div></div></div>
      <div className="card"><div className="card-body">
        {!rows ? <Loader /> : rows.length === 0 ? <EmptyState icon="bi-receipt" title="No records found" text="Add a record or adjust your filters." /> : (
          <div className="table-responsive"><table className="table table-hover align-middle">
            <thead><tr><th>ID</th><th>Date</th>{!type && <th>Type</th>}<th>Category</th><th>Description</th><th>Payment</th><th className="text-end">Amount</th><th /></tr></thead>
            <tbody>{rows.map((r) => (<tr key={r.id}><td className="text-muted">#{r.id}</td><td>{fmtDate(r.date)}</td>
              {!type && <td><span className={`badge bg-${r.type === 'income' ? 'success' : 'danger'}`}>{r.type}</span></td>}
              <td>{r.category_name}</td><td>{r.description}</td><td>{r.payment_method}</td>
              <td className={`text-end fw-semibold ${r.type === 'income' ? 'text-success' : 'text-danger'}`}>{money(r.amount)}</td>
              <td className="text-end text-nowrap"><button className="btn btn-sm btn-light me-1" onClick={() => setEditing(r)}><i className="bi bi-pencil" /></button>
                <button className="btn btn-sm btn-light text-danger" onClick={() => del(r)}><i className="bi bi-trash" /></button></td></tr>))}</tbody>
            <tfoot><tr><td colSpan={type ? 5 : 6} className="text-end text-muted">{rows.length} records · net</td><td className="text-end fw-bold">{money(total)}</td><td /></tr></tfoot>
          </table></div>)}
      </div></div>
      {editing && <TransactionForm initial={editing.id ? editing : null} fixedType={type} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}
