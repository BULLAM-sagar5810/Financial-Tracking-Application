export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop-custom" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card mx-auto mt-4" style={{ maxWidth: 520 }}>
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{title}</h5><button className="btn-close" onClick={onClose} />
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
