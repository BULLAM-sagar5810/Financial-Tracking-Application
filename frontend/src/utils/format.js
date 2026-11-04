export const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n || 0));
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const today = () => new Date().toISOString().slice(0, 10);
export const thisMonth = () => new Date().toISOString().slice(0, 7);
export const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16', '#64748b'];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer'];
