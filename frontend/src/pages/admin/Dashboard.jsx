import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Film, DollarSign, Activity, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from 'recharts';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import AdminLayout from '../../components/AdminLayout';

const COLORS = ['#00D4AA', '#00B4D8', '#43E97B', '#FFD93D', '#4FC3F7', '#BA68C8'];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard/').then(({ data: r }) => setData(r.data)).catch((err) => {
      console.error(err);
      setData({
        total_users: 0, active_users: 0, total_movies: 0, revenue_estimate: { monthly_revenue: 0 },
        registrations_by_month: [], plan_distribution: [], top_10_movies: []
      });
    });
  }, []);

  if (!data) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-sf-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const kpiCards = [
    { icon: Users, label: 'Total Usuarios', value: data.total_users, change: '+12%', gradient: 'from-[#00D4AA]/15 to-[#00D4AA]/5', accent: 'text-sf-accent', borderColor: 'rgba(0,212,170,0.15)' },
    { icon: Activity, label: 'Usuarios Activos', value: data.active_users, change: '+8%', gradient: 'from-[#00B4D8]/15 to-[#00B4D8]/5', accent: 'text-[#00B4D8]', borderColor: 'rgba(0,180,216,0.15)' },
    { icon: Film, label: 'Total Películas', value: data.total_movies, change: '+24', gradient: 'from-[#43E97B]/15 to-[#43E97B]/5', accent: 'text-[#43E97B]', borderColor: 'rgba(67,233,123,0.15)' },
    { icon: DollarSign, label: 'Revenue Mensual', value: `$${data.revenue_estimate?.monthly_revenue || 0}`, change: '+15%', gradient: 'from-[#FFD93D]/15 to-[#FFD93D]/5', accent: 'text-[#FFD93D]', borderColor: 'rgba(255,217,61,0.15)' },
  ];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-sf-accent" />
            <span className="text-sf-accent text-sm font-semibold tracking-wider uppercase">Panel de Control</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
            Hola, {user?.username} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-sf-text-secondary">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {kpiCards.map(({ icon: Icon, label, value, change, gradient, accent, borderColor }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient}`}
              style={{ border: `1px solid ${borderColor}` }}>

              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${accent}`}
                  style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-sf-accent-tertiary text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  {change}
                </div>
              </div>

              <p className={`text-3xl font-black ${accent} mb-1`}>{value}</p>
              <p className="text-xs text-sf-text-secondary font-medium">{label}</p>

              {/* Decorative glow */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10"
                style={{ background: `radial-gradient(circle, currentColor, transparent)` }} />
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Registrations chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="rounded-2xl p-6"
            style={{ background: 'rgba(12,12,29,0.6)', border: '1px solid rgba(0,212,170,0.08)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-white text-lg">Registros por mes</h3>
                <p className="text-xs text-sf-text-secondary">Crecimiento de usuarios</p>
              </div>
              <TrendingUp className="w-5 h-5 text-sf-accent" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.registrations_by_month || []}>
                <defs>
                  <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#8888AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(12,12,29,0.95)',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#00D4AA' }}
                />
                <Area type="monotone" dataKey="count" stroke="#00D4AA" strokeWidth={2.5}
                  fill="url(#regGradient)" dot={{ fill: '#00D4AA', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#00D4AA', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Plan distribution */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="rounded-2xl p-6"
            style={{ background: 'rgba(12,12,29,0.6)', border: '1px solid rgba(0,212,170,0.08)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-white text-lg">Distribución por plan</h3>
                <p className="text-xs text-sf-text-secondary">Suscripciones activas</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.plan_distribution || []} dataKey="count" nameKey="plan_name" cx="50%" cy="50%"
                  innerRadius={65} outerRadius={95} paddingAngle={4} strokeWidth={0}>
                  {(data.plan_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(12,12,29,0.95)',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8888AA' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Top movies table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(12,12,29,0.6)', border: '1px solid rgba(0,212,170,0.08)', backdropFilter: 'blur(12px)' }}>
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Top 10 Películas</h3>
              <p className="text-xs text-sf-text-secondary">Más vistas y mejor calificadas</p>
            </div>
            <Film className="w-5 h-5 text-sf-accent" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-sf-text-secondary text-xs uppercase tracking-wider"
                  style={{ borderBottom: '1px solid rgba(0,212,170,0.08)' }}>
                  <th className="py-3 px-6">#</th>
                  <th className="py-3">Título</th>
                  <th className="py-3">Vistas</th>
                  <th className="py-3">Rating</th>
                  <th className="py-3">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {(data.top_10_movies || []).map((m, i) => (
                  <tr key={m.id} className="transition-all duration-200 hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                        i < 3 ? 'bg-sf-accent/15 text-sf-accent' : 'bg-sf-elevated text-sf-text-secondary'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="py-4 font-semibold text-white">{m.title}</td>
                    <td className="py-4 font-mono text-sf-accent font-semibold">{m.watch_count}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 text-yellow-400 font-mono font-semibold">
                        ★ {m.avg_rating?.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-sf-text-secondary">{m.num_ratings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
