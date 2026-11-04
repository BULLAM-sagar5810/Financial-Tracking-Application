import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, msg, type }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ success: (m) => push(m, 'success'), error: (m) => push(m, 'danger'), warn: (m) => push(m, 'warning') }}>
      {children}
      <div className="toast-stack">
        {items.map((i) => (<div key={i.id} className={`alert alert-${i.type} shadow mb-0 py-2`}>{i.msg}</div>))}
      </div>
    </Ctx.Provider>
  );
}
