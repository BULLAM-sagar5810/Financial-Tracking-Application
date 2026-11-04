export default function StatCard({ label, value, icon, color = 'primary', sub }) {
  return (
    <div className="card h-100"><div className="card-body d-flex align-items-center gap-3">
      <div className={`stat-icon bg-${color} bg-opacity-10 text-${color}`}><i className={`bi ${icon}`} /></div>
      <div><div className="text-muted small">{label}</div><div className="fs-5 fw-semibold">{value}</div>{sub && <div className="small text-muted">{sub}</div>}</div>
    </div></div>
  );
}
