import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Clock, BarChart3, Save, Star, Play, Heart, Cpu } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import PlanBadge from '../components/PlanBadge';
import RatingStars from '../components/RatingStars';
import toast from 'react-hot-toast';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

const GENRE_COLORS = ['#00D4AA', '#00B4D8', '#43E97B', '#FFD93D', '#4FC3F7', '#BA68C8', '#FF8A65', '#81C784'];

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ username: '', country: '', language: '' });
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [genres, setGenres] = useState([]);
  const [userGenres, setUserGenres] = useState([]);
  const [genreBreakdown, setGenreBreakdown] = useState([]);

  useEffect(() => {
    if (user) {
      setProfile({ username: user.username, country: user.country || '', language: user.language || 'es' });
      api.get(`/users/${user.id}/history/`).then(({ data }) => {
        const h = data.data || [];
        setHistory(h);
        // Build genre breakdown from history
        const genreCount = {};
        h.forEach(item => {
          (item.movie?.genres || []).forEach(g => {
            genreCount[g.name] = (genreCount[g.name] || 0) + 1;
          });
        });
        const breakdown = Object.entries(genreCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }));
        setGenreBreakdown(breakdown);
      }).catch(() => {});
      api.get(`/users/${user.id}/stats/`).then(({ data }) => setStats(data.data)).catch(() => {});
      api.get('/genres/').then(({ data }) => setGenres(data.data || [])).catch(() => {});
      api.get(`/users/${user.id}/preferences/`).then(({ data }) => {
        setUserGenres((data.data?.genres || []).map((g) => g.id));
      }).catch(() => {});
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      const { data } = await api.put('/auth/me/', profile);
      updateUser(data.data);
      toast.success('Perfil actualizado');
    } catch (e) { toast.error('Error al actualizar'); }
  };

  const saveGenres = async () => {
    try {
      await api.put(`/users/${user.id}/preferences/`, { genre_ids: userGenres });
      toast.success('Preferencias actualizadas');
    } catch (e) { toast.error('Error al actualizar'); }
  };

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'history', label: 'Historial', icon: Clock },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  ];

  // KPI data for radial chart
  const radialData = stats ? [
    { name: 'Películas', value: Math.min(stats.total_watched * 10, 100), fill: '#00D4AA' },
    { name: 'Horas', value: Math.min(stats.total_hours * 5, 100), fill: '#00B4D8' },
    { name: 'Rating', value: stats.avg_rating_given ? (stats.avg_rating_given / 5) * 100 : 0, fill: '#FFD93D' },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-24 pb-16">
      <div className="max-w-[960px] mx-auto px-6">

        {/* Tab nav */}
        <div className="flex gap-1 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: 'rgba(12,12,29,0.8)', border: '1px solid rgba(0,212,170,0.08)' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={tab === id
                ? { background: '#00D4AA', color: '#060611', boxShadow: '0 0 16px rgba(0,212,170,0.3)' }
                : { color: 'rgba(240,240,255,0.5)' }
              }
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <div className="space-y-5">
            {/* Personal info */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)', backdropFilter: 'blur(12px)' }}>
              <h2 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-sf-accent" /> Información personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Nombre', key: 'username', type: 'text' },
                  { label: 'Email', key: 'email', type: 'text', value: user?.email, disabled: true },
                  { label: 'País', key: 'country', type: 'text' },
                ].map(({ label, key, type, value, disabled }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                      style={{ color: 'rgba(240,240,255,0.4)' }}>{label}</label>
                    <input
                      type={type}
                      value={value !== undefined ? value : profile[key]}
                      disabled={disabled}
                      onChange={disabled ? undefined : (e) => setProfile({ ...profile, [key]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                      style={{
                        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(0,212,170,0.12)',
                        opacity: disabled ? 0.5 : 1,
                      }}
                      onFocus={e => !disabled && (e.target.style.borderColor = 'rgba(0,212,170,0.4)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(0,212,170,0.12)')}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                    style={{ color: 'rgba(240,240,255,0.4)' }}>Idioma</label>
                  <select value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <button onClick={saveProfile}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: '#00D4AA', color: '#060611', boxShadow: '0 0 16px rgba(0,212,170,0.25)' }}>
                <Save className="w-4 h-4" /> Guardar cambios
              </button>
            </div>

            {/* Plan */}
            <div className="rounded-2xl p-6 flex items-center justify-between"
              style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)', backdropFilter: 'blur(12px)' }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'rgba(240,240,255,0.4)' }}>Plan actual</p>
                <PlanBadge planName={user?.plan_name || 'Gratuito'} size="md" />
              </div>
              <a href="/subscription"
                className="px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:scale-105"
                style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
                Cambiar plan
              </a>
            </div>

            {/* Genres */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)', backdropFilter: 'blur(12px)' }}>
              <h2 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-sf-accent" /> Géneros favoritos
              </h2>
              <p className="text-xs mb-4" style={{ color: 'rgba(240,240,255,0.4)' }}>Selecciona los géneros que más te gustan para personalizar tus recomendaciones.</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {genres.map((g) => {
                  const active = userGenres.includes(g.id);
                  return (
                    <button key={g.id}
                      onClick={() => setUserGenres(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                      style={active
                        ? { background: '#00D4AA', color: '#060611', boxShadow: '0 0 12px rgba(0,212,170,0.25)' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(240,240,255,0.55)', border: '1px solid rgba(255,255,255,0.06)' }
                      }
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
              <button onClick={saveGenres}
                className="px-5 py-2 text-sm font-semibold rounded-xl transition-all"
                style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
                Guardar preferencias
              </button>
            </div>
          </div>
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          <div className="space-y-3">
            {history.length === 0
              ? (
                <div className="text-center py-16 rounded-2xl"
                  style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)' }}>
                  <Play className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#00D4AA' }} />
                  <p style={{ color: 'rgba(240,240,255,0.4)' }} className="text-sm">Sin historial aún. ¡Reproduce tu primera película!</p>
                  <a href="/catalog" className="inline-block mt-4 text-sm font-semibold" style={{ color: '#00D4AA' }}>
                    Ir al catálogo →
                  </a>
                </div>
              )
              : history.map((h) => (
                <div key={h.id} className="rounded-xl p-4 flex items-center gap-4 transition-all"
                  style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.06)'}
                >
                  <img src={h.movie?.poster_url || ''} alt="" className="w-12 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{h.movie?.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(240,240,255,0.4)' }}>{new Date(h.watched_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="w-20 h-1.5 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${h.progress_pct}%`, background: '#00D4AA' }} />
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(240,240,255,0.4)' }}>{h.progress_pct}%</span>
                  </div>
                  {h.completed && (
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA' }}>✓ Vista</span>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* ── Stats tab ── */}
        {tab === 'stats' && (
          <div>
            {!stats ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00D4AA', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="space-y-6">

                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Películas vistas', value: stats.total_watched, color: '#00D4AA', icon: Play },
                    { label: 'Horas totales', value: `${stats.total_hours}h`, color: '#00B4D8', icon: Clock },
                    { label: 'Rating promedio', value: stats.avg_rating_given || '—', color: '#FFD93D', icon: Star },
                    { label: 'Género favorito', value: stats.favorite_genre || '—', color: '#43E97B', icon: Heart },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="rounded-2xl p-5 text-center transition-all"
                      style={{ background: 'rgba(12,12,29,0.7)', border: `1px solid ${color}1a` }}>
                      <Icon className="w-5 h-5 mx-auto mb-2 opacity-60" style={{ color }} />
                      <p className="text-2xl font-black" style={{ color }}>{value}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(240,240,255,0.4)' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {stats.total_watched > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Radial activity chart */}
                      <div className="rounded-2xl p-6"
                        style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)' }}>
                        <h3 className="font-bold text-white mb-1">Actividad general</h3>
                        <p className="text-xs mb-4" style={{ color: 'rgba(240,240,255,0.4)' }}>Tu progreso como espectador</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%"
                            data={radialData} startAngle={90} endAngle={-270}>
                            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.04)' }} />
                            <Tooltip
                              formatter={(v) => [`${Math.round(v)}%`, '']}
                              contentStyle={{ background: 'rgba(6,6,17,0.97)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12 }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'rgba(240,240,255,0.5)' }} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Genre breakdown pie */}
                      <div className="rounded-2xl p-6"
                        style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)' }}>
                        <h3 className="font-bold text-white mb-1">Géneros vistos</h3>
                        <p className="text-xs mb-4" style={{ color: 'rgba(240,240,255,0.4)' }}>Distribución de tu historial</p>
                        {genreBreakdown.length > 0 ? (
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={genreBreakdown} dataKey="value" nameKey="name"
                                cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                                {genreBreakdown.map((_, i) => (
                                  <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ background: 'rgba(6,6,17,0.97)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12 }}
                                formatter={(v, n) => [`${v} película${v !== 1 ? 's' : ''}`, n]}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'rgba(240,240,255,0.5)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-sm py-16" style={{ color: 'rgba(240,240,255,0.3)' }}>Sin datos de géneros</p>
                        )}
                      </div>

                    </div>

                    {/* AI Analysis Card */}
                    {stats.ai_weights && stats.ai_weights.length > 0 && (
                      <div className="rounded-2xl p-6 relative overflow-hidden"
                        style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.15)' }}>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-sf-accent/10 rounded-full blur-[40px]"></div>
                        
                        <div className="flex items-center justify-between mb-6 relative z-10">
                          <div>
                            <h3 className="font-black text-xl text-white flex items-center gap-2">
                              <Cpu className="w-6 h-6 text-sf-accent" /> Análisis de la IA: Tu Perfil
                            </h3>
                            <p className="text-sm mt-1" style={{ color: 'rgba(240,240,255,0.5)' }}>
                              Así es como el algoritmo matemático clasifica tus gustos en tiempo real
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
                          {stats.ai_weights.map((w, index) => (
                            <div key={w.name} className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                              <span className="text-3xl font-black mb-1" style={{ color: index === 0 ? '#00D4AA' : '#fff' }}>
                                {w.points} <span className="text-sm font-normal text-gray-500">pts</span>
                              </span>
                              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(240,240,255,0.7)' }}>
                                {w.name}
                              </span>
                              {index === 0 && (
                                <span className="mt-2 text-xs px-2 py-1 bg-sf-accent/20 text-sf-accent rounded-full font-bold">
                                  #1 Favorito
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl p-10 text-center"
                    style={{ background: 'rgba(12,12,29,0.7)', border: '1px solid rgba(0,212,170,0.08)' }}>
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: '#00D4AA' }} />
                    <p className="text-sm mb-3" style={{ color: 'rgba(240,240,255,0.45)' }}>
                      Tus estadísticas y gráficas aparecerán aquí cuando reproduzcas películas.
                    </p>
                    <a href="/catalog" className="text-sm font-bold" style={{ color: '#00D4AA' }}>
                      Explorar catálogo →
                    </a>
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
