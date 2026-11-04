export default function EmptyState({ icon = 'bi-inbox', title, text, children }) {
  return (<div className="empty-state"><i className={`bi ${icon}`} /><h5 className="mt-2 text-secondary">{title}</h5><p>{text}</p>{children}</div>);
}
