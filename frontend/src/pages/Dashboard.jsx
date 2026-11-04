import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { COLORS, fmtDate, money } from '../utils/format';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const [d, setD] = useState(null); const [budgets, setBudgets] = useState([]); const toast = useToast();
  const load = () => Promise.all([api.get('/dashboard/'), api.get('/budgets/', { params: { month: new Date().toISOString().slice(0, 7) } })])
    .then(([a, b]) => { setD(a.data); setBudgets(b.data); }).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);
  if (!d) return <Loader />;
  const { totals: t, month: m } = d;
  const warn = budgets.filter((b) => b.status !== 'ok');
  const loadDemo = async () => { try { await api.post('/demo-data/'); toast.success('Demo data loaded'); load(); } catch (e) { toast.error(errMsg(e)); } };

  if (t.transactions === 0) return (
    <div className="card"><EmptyState icon="bi-bar-chart-line" title="No transactions yet" text="Add your first income or expense, or load sample data to explore the app.">
      <Link className="btn btn-primary me-2" to="/expenses">Add expense</Link><button className="btn btn-outline-primary" onClick={loadDemo}>Load demo data</button></EmptyState></div>);

  return (
    <>
      {warn.map((b) => (
        <div key={b.id} className={`alert alert-${b.status === 'exceeded' ? 'danger' : 'warning'} py-2`}>
          <i className="bi bi-exclamation-triangle me-2" /><strong>{b.category_name}</strong>: {b.status === 'exceeded' ? 'budget exceeded' : 'approaching limit'} ({b.percent_used}% of {money(b.amount)} used)
        </div>))}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-4"><StatCard label="Total Income" value={money(t.income)} icon="bi-arrow-down-circle" color="success" /></div>
        <div className="col-6 col-xl-4"><StatCard label="Total Expenses" value={money(t.expense)} icon="bi-arrow-up-circle" color="danger" /></div>
        <div className="col-6 col-xl-4"><StatCard label="Available Balance" value={money(t.balance)} icon="bi-wallet2" color="primary" /></div>
        <div className="col-6 col-xl-4"><StatCard label="Monthly Savings" value={money(m.savings)} icon="bi-piggy-bank" color="info" sub="This month" /></div>
        <div className="col-6 col-xl-4"><StatCard label="Total Transactions" value={t.transactions} icon="bi-receipt" color="warning" /></div>
        <div className="col-6 col-xl-4"><StatCard label="Monthly Budget" value={m.budget ? money(m.budget) : 'Not set'} icon="bi-bullseye" color="secondary" sub={m.budget ? `${m.budget_used_percent}% used` : <Link to="/budgets">Set budget</Link>} /></div>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-lg-7"><div className="card h-100"><div className="card-body"><h6>Income vs Expense (6 months)</h6>
          <ResponsiveContainer width="100%" height={280}><BarChart data={d.monthly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={money} /><Legend />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div></div>
        <div className="col-lg-5"><div className="card h-100"><div className="card-body"><h6>Expenses by category (this month)</h6>
          {d.categories.length ? <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={d.categories} dataKey="total" nameKey="name" outerRadius={95} label={(x) => x.name}>
            {d.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={money} /></PieChart></ResponsiveContainer>
            : <EmptyState icon="bi-pie-chart" title="No expenses this month" />}</div></div></div>
        <div className="col-lg-7"><div className="card h-100"><div className="card-body"><h6>Monthly expense trend</h6>
          <ResponsiveContainer width="100%" height={240}><LineChart data={d.monthly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={money} /><Line dataKey="expense" stroke="#4f46e5" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div></div></div>
        <div className="col-lg-5"><div className="card h-100"><div className="card-body"><h6>Monthly financial summary</h6>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between"><span>Income</span><strong className="text-success">{money(m.income)}</strong></li>
            <li className="list-group-item d-flex justify-content-between"><span>Expenses</span><strong className="text-danger">{money(m.expense)}</strong></li>
            <li className="list-group-item d-flex justify-content-between"><span>Savings</span><strong>{money(m.savings)}</strong></li>
            <li className="list-group-item d-flex justify-content-between"><span>Savings rate</span><strong>{m.income > 0 ? `${((m.savings / m.income) * 100).toFixed(1)}%` : '—'}</strong></li></ul></div></div></div>
      </div>
      <div className="card"><div className="card-body"><div className="d-flex justify-content-between"><h6>Recent transactions</h6><Link to="/transactions">View all</Link></div>
        <div className="table-responsive"><table className="table align-middle mb-0"><tbody>
          {d.recent.map((r) => (<tr key={r.id}><td>{fmtDate(r.date)}</td><td>{r.category_name}</td><td className="text-muted">{r.description}</td>
            <td className={`text-end fw-semibold ${r.type === 'income' ? 'text-success' : 'text-danger'}`}>{r.type === 'income' ? '+' : '−'}{money(r.amount)}</td></tr>))}</tbody></table></div></div></div>
    </>
  );
}
