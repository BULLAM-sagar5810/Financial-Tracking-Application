import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => { const { data } = await api.get('/auth/profile/'); setUser(data); return data; };

  useEffect(() => {
    if (!localStorage.getItem('access')) { setLoading(false); return; }
    loadProfile().catch(() => localStorage.clear()).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    await loadProfile();
  };
  const register = async (form) => { await api.post('/auth/register/', form); await login(form.username, form.password); };
  const logout = () => { localStorage.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout, loadProfile }}>{children}</Ctx.Provider>;
}
