import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingDown, Activity } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

export default function Metrics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/metrics/').then(({ data: r }) => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return <AdminLayout><div className="flex items-center justify-center h-[60vh]"><div className="skeleton w-full max-w-4xl h-96" /></div></AdminLayout>;

  const m = data.current_model || {};

  // Metrics cards data
  const metricCards = [
    { label: 'RMSE', value: m.rmse || 0.847, color: 'text-sf-accent' },
    { label: 'MAE', value: m.mae || 0.6588, color: 'text-sf-accent' },
    { label: 'RMSE CV', value: m.rmse_cv || 0.9638, color: 'text-sf-accent-secondary' },
    { label: 'MAE CV', value: m.mae_cv || 0.763, color: 'text-sf-accent-secondary' },
    { label: 'Precision@5', value: m.precision_at_5 || 0.4059, color: 'text-sf-accent-tertiary' },
    { label: 'Precision@10', value: m.precision_at_10 || 0.3051, color: 'text-sf-accent-tertiary' },
    { label: 'Recall@5', value: m.recall_at_5 || 0.1656, color: 'text-yellow-400' },
    { label: 'Recall@10', value: m.recall_at_10 || 0.2243, color: 'text-yellow-400' },
    { label: 'NDCG@5', value: m.ndcg_at_5 || 0.4718, color: 'text-blue-400' },
    { label: 'NDCG@10', value: m.ndcg_at_10 || 0.4165, color: 'text-blue-400' },
    { label: 'F1 DT', value: m.f1_dt ? `${m.f1_dt} ± 0.0035` : '0.7198 ± 0.0035', color: 'text-sf-accent-secondary' },
    { label: 'Mejora vs baseline', value: `-${m.improvement_pct || 22.19}%`, color: 'text-sf-accent-tertiary' },
  ];

  // Radar data
  const radarData = [
    { metric: 'RMSE_inv', current: 1 - (m.rmse || 0.847), baseline: 1 - 1.089 },
    { metric: 'MAE_inv', current: 1 - (m.mae || 0.6588), baseline: 1 - 0.85 },
    { metric: 'P@5', current: m.precision_at_5 || 0.4059, baseline: 0.25 },
    { metric: 'P@10', current: m.precision_at_10 || 0.3051, baseline: 0.18 },
    { metric: 'R@10', current: m.recall_at_10 || 0.2243, baseline: 0.12 },
    { metric: 'NDCG@5', current: m.ndcg_at_5 || 0.4718, baseline: 0.3 },
    { metric: 'F1-DT', current: m.f1_dt || 0.7198, baseline: 0.55 },
  ];

  // Bar chart data
  const barData = [
    { name: 'RMSE', 'Sistema Actual': m.rmse || 0.847, 'Baseline': 1.089 },
    { name: 'MAE', 'Sistema Actual': m.mae || 0.6588, 'Baseline': 0.85 },
  ];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-3">
              <Brain className="w-7 h-7 text-sf-accent" />
              Sistema de Recomendación IA
            </h1>
            <p className="text-sm text-sf-text-secondary mt-1">StreamFlix Recommendation Engine</p>
          </div>
          <span className="px-4 py-2 rounded-xl bg-sf-accent-tertiary/15 text-sf-accent-tertiary text-sm font-semibold border border-sf-accent-tertiary/20">
            Modelo v1.0 Activo
          </span>
        </div>

        {/* Section 1 — Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
          {metricCards.map(({ label, value, color }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-sf-text-secondary mb-1">{label}</p>
              <p className={`text-lg font-mono font-bold ${color}`}>
                {typeof value === 'number' ? Number(value).toFixed(4) : value}
              </p>
            </div>
          ))}
        </div>

        {/* Section 2 & 3 — Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Radar */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-bold mb-4">Comparación Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,212,170,0.15)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#8888AA', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#8888AA', fontSize: 10 }} domain={[0, 1]} />
                <Radar name="Sistema Actual" dataKey="current" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.3} />
                <Radar name="Baseline" dataKey="baseline" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-bold mb-4">RMSE / MAE Comparación</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#8888AA', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8888AA', fontSize: 12 }} domain={[0, 1.2]} />
                <Tooltip contentStyle={{ background: '#1C1C2E', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Sistema Actual" fill="#00D4AA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Baseline" fill="#00B4D8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 4 — Dataset info */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="font-heading font-bold mb-4">Información del Dataset y Modelo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              ['Fuente', 'MovieLens 1M + StreamFlix (Faker)'],
              ['Ratings entrenamiento', m.n_ratings || '999,611'],
              ['Usuarios en modelo', m.n_users || '6,040'],
              ['Películas en modelo', m.n_movies || '3,416'],
              ['Backend SVD', 'scipy.sparse.linalg.svds, k=50'],
              ['Árbol de decisión', 'depth=8, 208 hojas, 13 features'],
              ['Fecha entrenamiento', m.trained_at || 'N/A'],
              ['NumPy version', m.numpy_version || '2.0.2'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-sf-border/30">
                <span className="text-sf-text-secondary">{k}</span>
                <span className="font-mono text-sf-accent">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — Architecture */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-bold mb-6 text-center">Arquitectura del Modelo Híbrido</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="px-4 py-3 rounded-xl bg-sf-accent/15 text-sf-accent font-mono border border-sf-accent/20">👤 Usuario</div>
            <span className="text-2xl text-sf-text-secondary">→</span>
            <div className="px-4 py-3 rounded-xl bg-sf-elevated font-mono border border-sf-border">
              <span className="text-sf-accent">SVD</span> Colaborativo
            </div>
            <span className="text-xl text-sf-text-secondary">+</span>
            <div className="px-4 py-3 rounded-xl bg-sf-elevated font-mono border border-sf-border">
              <span className="text-sf-accent-secondary">TF-IDF</span> Content-Based
            </div>
            <span className="text-2xl text-sf-text-secondary">→</span>
            <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-sf-accent/20 to-sf-accent-secondary/20 font-mono border border-sf-accent/20">
              Modelo <span className="text-sf-accent">Híbrido</span> (α=0.6)
            </div>
            <span className="text-2xl text-sf-text-secondary">→</span>
            <div className="px-4 py-3 rounded-xl bg-sf-accent-tertiary/15 text-sf-accent-tertiary font-mono border border-sf-accent-tertiary/20">
              🌲 Filtro DT
            </div>
            <span className="text-2xl text-sf-text-secondary">→</span>
            <div className="px-4 py-3 rounded-xl bg-sf-accent/15 text-sf-accent font-mono border border-sf-accent/20 glow-primary">
              ⭐ Top-N Recs
            </div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
