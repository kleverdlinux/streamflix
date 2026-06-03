import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import { Header } from './components/landing/Header';
import AuthModal from './components/auth/AuthModal';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/RouteGuards';
import { useAuthStore } from './stores/authStore';

import Landing from './pages/Landing';
import Catalog from './pages/Catalog';
import MovieDetail from './pages/MovieDetail';
import Player from './pages/Player';
import ForYou from './pages/ForYou';
import MyList from './pages/MyList';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMovies from './pages/admin/Movies';
import AdminUsers from './pages/admin/Users';
import AdminMetrics from './pages/admin/Metrics';
import AdminLogs from './pages/admin/Logs';

export default function App() {
  const location = useLocation();
  const { user } = useAuthStore();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      let attempts = 0;
      const interval = setInterval(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'instant' });
          clearInterval(interval);
        }
        if (++attempts > 15) clearInterval(interval); // Try for 1.5s
      }, 50);
      return () => clearInterval(interval);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1C1C2E',
            color: '#F0F0FF',
            border: '1px solid rgba(0,212,170,0.3)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#43E97B', secondary: '#1C1C2E' } },
          error: { iconTheme: { primary: '#FF6584', secondary: '#1C1C2E' } },
          duration: 4000,
        }}
      />
      {user && !isLanding && <Navbar />}
      {!user && <Header />}
      <AuthModal />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/player/:id" element={<ProtectedRoute><Player /></ProtectedRoute>} />
        <Route path="/for-you" element={<ProtectedRoute><ForYou /></ProtectedRoute>} />
        <Route path="/my-list" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/movies" element={<AdminRoute><AdminMovies /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/metrics" element={<AdminRoute><AdminMetrics /></AdminRoute>} />
        <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
      </Routes>
    </div>
  );
}
