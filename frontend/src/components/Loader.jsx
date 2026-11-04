export default function Loader({ full }) {
  return (
    <div className={`d-flex justify-content-center align-items-center ${full ? 'vh-100' : 'py-5'}`}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  );
}
