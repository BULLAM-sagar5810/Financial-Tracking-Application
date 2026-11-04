import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Loader from './components/Loader';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader full />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/income" element={<TransactionsPage key="income" type="income" />} />
        <Route path="/expenses" element={<TransactionsPage key="expense" type="expense" />} />
        <Route path="/transactions" element={<TransactionsPage key="all" />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
