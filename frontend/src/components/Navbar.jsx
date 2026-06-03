import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, LogOut, Settings, Shield, ChevronDown, X, Play } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function Navbar() {
  const { user, isAdmin, logout, openAuthModal } = useAuthStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const genreRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get('/genres/').then(res => setGenres(res.data.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false); setSearchResults([]);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (genreRef.current && !genreRef.current.contains(e.target)) setGenreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/movies/?search=${encodeURIComponent(q)}&page_size=6`);
        setSearchResults(data.data || []);
      } catch (e) { setSearchResults([]); }
    }, 300);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={scrolled ? {
        background: 'rgba(3,3,10,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      } : {
        background: 'transparent',
        backdropFilter: 'blur(0px)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Logo (identical to landing) ── */}
        <Link to={user ? '/catalog' : '/'} className="flex items-center gap-3 shrink-0 hover:opacity-90 transition-opacity">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
          </div>
          <span
            className="text-xl font-black text-white hidden sm:block"
          >
            StreamFlix
          </span>
        </Link>

        {/* ── Nav links (visible for all, but personal links gated) ── */}
        <div className="hidden md:flex items-center gap-1">
          {/* Películas */}
          <Link to="/catalog"
            className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            style={{ color: 'rgba(240,240,255,0.7)' }}
            onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.target.style.color = 'rgba(240,240,255,0.7)'; e.target.style.background = 'transparent'; }}
          >
            Películas
          </Link>

          {/* Géneros dropdown */}
          <div ref={genreRef} className="relative">
            <button
              onClick={() => setGenreOpen(!genreOpen)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{ color: genreOpen ? '#fff' : 'rgba(240,240,255,0.7)', background: genreOpen ? 'rgba(255,255,255,0.08)' : 'transparent' }}
            >
              Géneros
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${genreOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {genreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 mt-2 z-50 w-[580px]"
                  style={{
                    background: 'rgba(6,6,17,0.97)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(0,212,170,0.15)',
                    borderRadius: 16,
                    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  {/* Header */}
                  <div className="px-5 pt-4 pb-2 border-b" style={{ borderColor: 'rgba(0,212,170,0.08)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00D4AA' }}>Explorar por género</p>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-1">
                    {genres.map(g => (
                      <Link
                        key={g.slug}
                        to={`/catalog?genre=${g.slug}`}
                        onClick={() => setGenreOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                        style={{ color: 'rgba(240,240,255,0.65)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.1)'; e.currentTarget.style.color = '#00D4AA'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(240,240,255,0.65)'; }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 group-hover:opacity-100 shrink-0" />
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Para Ti */}
          {user && (
            <Link to="/for-you"
              className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{ color: 'rgba(240,240,255,0.7)' }}
              onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.target.style.color = 'rgba(240,240,255,0.7)'; e.target.style.background = 'transparent'; }}
            >
              Para Ti
            </Link>
          )}

          {/* Mi Lista */}
          {user && (
            <Link to="/my-list"
              className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{ color: 'rgba(240,240,255,0.7)' }}
              onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.target.style.color = 'rgba(240,240,255,0.7)'; e.target.style.background = 'transparent'; }}
            >
              Mi Lista
            </Link>
          )}
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-3 ml-auto">

          {/* Search */}
          {user && (
            <div ref={searchRef} className="relative">
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.div
                    key="search-open"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center relative"
                  >
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Buscar películas..."
                      className="w-full h-9 px-4 pr-8 text-sm rounded-xl text-white outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(0,212,170,0.25)',
                        color: '#fff',
                      }}
                    />
                    <X
                      className="w-4 h-4 absolute right-2.5 cursor-pointer transition-colors"
                      style={{ color: 'rgba(240,240,255,0.5)' }}
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                    />
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-icon"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg transition-all duration-200"
                    style={{ color: 'rgba(240,240,255,0.6)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#00D4AA'; e.currentTarget.style.background = 'rgba(0,212,170,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Search className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Search results */}
              <AnimatePresence>
                {searchResults.length > 0 && searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-12 right-0 w-[340px] overflow-hidden"
                    style={{
                      background: 'rgba(6,6,17,0.97)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0,212,170,0.15)',
                      borderRadius: 16,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    }}
                  >
                    {searchResults.map((movie) => (
                      <Link
                        key={movie.id}
                        to={`/movie/${movie.id}`}
                        onClick={() => { setSearchOpen(false); setSearchResults([]); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-4 py-3 transition-all duration-150"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <img src={movie.poster_url || 'https://via.placeholder.com/40x60?text=SF'} alt={movie.title}
                          className="w-10 h-14 object-cover rounded-lg" />
                        <div>
                          <p className="text-sm font-semibold text-white">{movie.title}</p>
                          <p className="text-xs" style={{ color: 'rgba(240,240,255,0.45)' }}>{movie.year} · ⭐ {movie.avg_rating}</p>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User menu / Auth */}
          {user ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-200"
                style={{
                  background: menuOpen ? 'rgba(0,212,170,0.1)' : 'transparent',
                  border: '1px solid transparent',
                  borderColor: menuOpen ? 'rgba(0,212,170,0.2)' : 'transparent',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: 'rgba(0,212,170,0.15)', border: '1.5px solid rgba(0,212,170,0.4)' }}
                >
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <User className="w-4 h-4" style={{ color: '#00D4AA' }} />
                  }
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} style={{ color: 'rgba(240,240,255,0.5)' }} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-12 right-0 w-56 overflow-hidden"
                    style={{
                      background: 'rgba(6,6,17,0.97)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(0,212,170,0.12)',
                      borderRadius: 16,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* User info */}
                    <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,212,170,0.08)' }}>
                      <p className="text-sm font-bold text-white">{user.username}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(240,240,255,0.45)' }}>{user.email}</p>
                    </div>

                    {[
                      { to: '/profile', icon: User, label: 'Mi Perfil' },
                      { to: '/subscription', icon: Settings, label: 'Mi Plan' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
                        style={{ color: 'rgba(240,240,255,0.65)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.06)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(240,240,255,0.65)'; }}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </Link>
                    ))}

                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
                        style={{ color: '#00D4AA' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}

                    <div style={{ borderTop: '1px solid rgba(0,212,170,0.08)' }}>
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-sm transition-all duration-150"
                        style={{ color: 'rgba(255,101,132,0.8)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,101,132,0.06)'; e.currentTarget.style.color = '#FF6584'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,101,132,0.8)'; }}
                      >
                        <LogOut className="w-4 h-4" /> Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuthModal('login')}
                className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(240,240,255,0.65)' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(240,240,255,0.65)'}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-5 py-2 text-sm font-black rounded-lg transition-all hover:scale-105"
                style={{
                  background: '#ffffff',
                  color: '#060611',
                  boxShadow: '0 0 18px rgba(255,255,255,0.3)',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 18px rgba(255,255,255,0.3)'}
              >
                Comenzar
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
