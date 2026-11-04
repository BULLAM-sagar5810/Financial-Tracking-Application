import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  ['/', 'bi-speedometer2', 'Dashboard'], ['/income', 'bi-arrow-down-circle', 'Income'],
  ['/expenses', 'bi-arrow-up-circle', 'Expenses'], ['/transactions', 'bi-list-ul', 'Transactions'],
  ['/budgets', 'bi-piggy-bank', 'Budgets'], ['/reports', 'bi-graph-up-arrow', 'Reports'],
  ['/profile', 'bi-person-circle', 'Profile'], ['/settings', 'bi-gear', 'Settings'],
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const out = () => { logout(); nav('/login'); };
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><i className="bi bi-wallet2 me-2" />FinTrack</div>
        <nav className="nav flex-column flex-grow-1">
          {NAV.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className="nav-link" onClick={() => setOpen(false)}>
              <i className={`bi ${icon}`} />{label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-outline-light m-3" onClick={out}><i className="bi bi-box-arrow-left me-2" />Logout</button>
      </aside>
      <div className="main">
        <header className="topbar d-flex align-items-center justify-content-between px-3 py-2">
          <button className="btn btn-light d-lg-none" onClick={() => setOpen(!open)}><i className="bi bi-list fs-5" /></button>
          <div className="d-none d-lg-block text-muted">Welcome back, <strong>{user.first_name || user.username}</strong> 👋</div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary rounded-pill px-3 py-2"><i className="bi bi-person me-1" />{user.username}</span>
            <button className="btn btn-sm btn-outline-danger" onClick={out}>Logout</button>
          </div>
        </header>
        <main className="p-3 p-md-4"><Outlet /></main>
      </div>
    </>
  );
}
