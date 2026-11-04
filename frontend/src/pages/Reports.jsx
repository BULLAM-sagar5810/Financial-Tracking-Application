import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import api, { downloadCsv, errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { money } from '../utils/format';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';

export default function Reports() {
  const toast = useToast();
  const [period, setPeriod] = useState('monthly'); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [r, setR] = useState(null);
  useEffect(() => {
    setR(null);
    api.get('/reports/', { params: { period, ...(from && { date_from: from }), ...(to && { date_to: to }) } }).then((x) => setR(x.data)).catch((e) => toast.error(errMsg(e)));
  }, [period, from, to]);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">Reports & Analytics</h4>
        <button className="btn btn-outline-primary" onClick={() => downloadCsv({ ...(from && { date_from: from }), ...(to && { date_to: to }) }).then(() => toast.success('CSV downloaded')).catch((e) => toast.error(errMsg(e)))}><i className="bi bi-download me-1" />Download CSV</button>
      </div>
      <div className="card mb-3"><div className="card-body row g-2">
        <div className="col-md-4"><select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {['daily', 'weekly', 'monthly', 'yearly'].map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)} report</option>)}</select></div>
        <div className="col-6 col-md-4"><input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="col-6 col-md-4"><input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div></div>
      {!r ? <Loader /> : r.series.length === 0 ? <div className="card"><EmptyState icon="bi-graph-up" title="No data for this range" /></div> : (
        <>
          <div className="row g-3 mb-3">
            <div className="col-md-3 col-6"><StatCard label="Income" value={money(r.summary.income)} icon="bi-arrow-down-circle" color="success" /></div>
            <div className="col-md-3 col-6"><StatCard label="Expenses" value={money(r.summary.expense)} icon="bi-arrow-up-circle" color="danger" /></div>
            <div className="col-md-3 col-6"><StatCard label="Savings" value={money(r.summary.savings)} icon="bi-piggy-bank" color="primary" /></div>
            <div className="col-md-3 col-6"><StatCard label="Savings rate" value={`${r.summary.savings_rate}%`} icon="bi-percent" color="info" /></div>
          </div>
          <div className="card mb-3"><div className="card-body"><h6>Income vs Expense</h6>
            <ResponsiveContainer width="100%" height={300}><BarChart data={r.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip formatter={money} /><Legend />
              <Bar dataKey="income" fill="#10b981" /><Bar dataKey="expense" fill="#ef4444" /><Bar dataKey="savings" fill="#4f46e5" /></BarChart></ResponsiveContainer></div></div>
          <div className="row g-3">
            <div className="col-lg-7"><div className="card"><div className="card-body"><h6>Savings analysis</h6><div className="table-responsive"><table className="table table-sm">
              <thead><tr><th>Period</th><th className="text-end">Income</th><th className="text-end">Expense</th><th className="text-end">Savings</th></tr></thead>
              <tbody>{r.series.map((s) => <tr key={s.period}><td>{s.period}</td><td className="text-end">{money(s.income)}</td><td className="text-end">{money(s.expense)}</td><td className={`text-end fw-semibold ${s.savings < 0 ? 'text-danger' : 'text-success'}`}>{money(s.savings)}</td></tr>)}</tbody></table></div></div></div></div>
            <div className="col-lg-5"><div className="card"><div className="card-body"><h6>Category-wise spending</h6><table className="table table-sm">
              <tbody>{r.categories.map((c) => <tr key={c.name}><td>{c.name}</td><td className="text-muted">{c.count} txns</td><td className="text-end">{money(c.total)}</td></tr>)}</tbody></table></div></div></div>
          </div>
        </>)}
    </>
  );
}
