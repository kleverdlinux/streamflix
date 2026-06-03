import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, isAdmin } = useAuthStore();
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/catalog" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user } = useAuthStore();
  if (user) return <Navigate to="/catalog" replace />;
  return children;
}
