import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Film, Users, Brain, ClipboardList, ChevronRight, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, desc: 'Vista general' },
  { to: '/admin/movies', label: 'Películas', icon: Film, desc: 'Gestionar catálogo' },
  { to: '/admin/users', label: 'Usuarios', icon: Users, desc: 'Gestionar usuarios' },
  { to: '/admin/metrics', label: 'Métricas IA', icon: Brain, desc: 'Rendimiento del modelo' },
  { to: '/admin/logs', label: 'Logs', icon: ClipboardList, desc: 'Actividad del sistema' },
];

function SidebarContent({ pathname, onLinkClick }) {
  return (
    <>
      {/* Admin badge */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,180,216,0.15))', border: '1px solid rgba(0,212,170,0.2)' }}>
            <Shield className="w-4 h-4 text-sf-accent" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-wide">Admin Panel</span>
            <p className="text-[10px] text-sf-text-secondary">StreamFlix Control</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,170,0.15), transparent)' }} />

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon, desc }) => {
          const isActive = pathname === to;
          return (
            <Link key={to} to={to}
              onClick={onLinkClick}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'text-white'
                  : 'text-sf-text-secondary hover:text-white'
              }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,180,216,0.08))',
                border: '1px solid rgba(0,212,170,0.15)',
                boxShadow: '0 0 20px rgba(0,212,170,0.05)',
              } : {}}>
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-sf-accent/20 text-sf-accent'
                  : 'text-sf-text-secondary group-hover:text-sf-accent group-hover:bg-sf-accent/10'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block leading-tight">{label}</span>
                <span className="text-[10px] text-sf-text-secondary opacity-70">{desc}</span>
              </div>
              {isActive && (
                <motion.div layoutId="admin-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-sf-accent"
                  style={{ boxShadow: '0 0 8px rgba(0,212,170,0.5)' }} />
              )}
              <ChevronRight className={`w-3 h-3 transition-all duration-300 ${isActive ? 'opacity-60 text-sf-accent' : 'opacity-0 group-hover:opacity-40'}`} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="p-5 pt-0">
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.08)' }}>
          <p className="text-[10px] text-sf-text-secondary">Motor IA v1.0</p>
          <p className="text-[10px] text-sf-accent font-semibold">SVD + Random Forest</p>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen pt-16 flex flex-col" style={{ background: '#060611' }}>

      {/* ── Mobile top bar for admin (visible < lg) ── */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3"
        style={{
          background: 'rgba(12,12,29,0.95)',
          borderBottom: '1px solid rgba(0,212,170,0.08)',
        }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sf-accent" />
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>
        {/* Current page label */}
        <span className="ml-auto text-xs font-medium" style={{ color: 'rgba(0,212,170,0.6)' }}>
          {links.find(l => l.to === pathname)?.label || 'Dashboard'}
        </span>
      </div>

      <div className="flex flex-1">
        {/* ── Desktop Sidebar (hidden on mobile) ── */}
        <aside className="w-[260px] fixed top-16 bottom-0 left-0 hidden lg:flex flex-col z-30"
          style={{
            background: 'linear-gradient(180deg, rgba(12,12,29,0.95) 0%, rgba(6,6,17,0.98) 100%)',
            borderRight: '1px solid rgba(0,212,170,0.08)',
          }}>
          <SidebarContent pathname={pathname} onLinkClick={() => {}} />
        </aside>

        {/* ── Mobile Sidebar (slide-out overlay) ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[60]"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                onClick={() => setSidebarOpen(false)}
              />

              {/* Sidebar panel */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] z-[70] flex flex-col"
                style={{
                  background: 'linear-gradient(180deg, rgba(12,12,29,0.98) 0%, rgba(6,6,17,1) 100%)',
                  borderRight: '1px solid rgba(0,212,170,0.1)',
                  boxShadow: '8px 0 30px rgba(0,0,0,0.5)',
                }}
              >
                {/* Close button */}
                <div className="flex justify-end p-4 pb-0">
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg" style={{ color: 'rgba(240,240,255,0.5)' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <SidebarContent pathname={pathname} onLinkClick={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content area */}
        <main className="flex-1 lg:ml-[260px] min-h-[calc(100vh-64px)]">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
