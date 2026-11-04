import axios from 'axios';

export const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('access');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    const refresh = localStorage.getItem('refresh');
    if (err.response?.status === 401 && !orig._retry && refresh && !orig.url.includes('auth/')) {
      orig._retry = true;
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh/`, { refresh });
        localStorage.setItem('access', data.access);
        orig.headers.Authorization = `Bearer ${data.access}`;
        return api(orig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => {
  const d = e.response?.data;
  if (!d) return e.message || 'Network error – is the backend running?';
  if (typeof d === 'string') return 'Server error';
  if (d.detail) return d.detail;
  return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(' ')}`).join(' | ');
};

export const downloadCsv = async (params) => {
  const { data } = await api.get('/reports/export/', { params, responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url; a.download = 'transactions.csv'; a.click();
  URL.revokeObjectURL(url);
};

export default api;
