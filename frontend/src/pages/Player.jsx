import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import AdPlayer from '../components/AdPlayer';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, plan } = useAuthStore();
  const [movie, setMovie] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adFinished, setAdFinished] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (plan && plan.id === 1 && !adFinished) {
      setShowAd(true);
    }
  }, [plan, adFinished]);

  useEffect(() => {
    api.get(`/movies/${id}/`).then(({ data }) => {
      const m = data.data;
      setMovie(m);
      if (m.min_plan_id && plan && m.min_plan_id > plan.id) {
        setBlocked(true);
      } else {
        // Record watch — mark as completed immediately for demo
        api.post(`/movies/${id}/watch/`, { progress_pct: 100, completed: true, device_type: 'web' }).catch(() => {});
      }
    });

    return () => {
      // Also record on unmount (safety net)
      api.post(`/movies/${id}/watch/`, {
        progress_pct: 100, completed: true, device_type: 'web',
      }).catch(() => {});
    };
  }, [id]);

  if (!movie) return <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="skeleton w-[800px] h-[450px]" />
  </div>;

  if (showAd) {
    return <AdPlayer onComplete={() => { setShowAd(false); setAdFinished(true); }} />;
  }

  if (blocked) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-10 text-center max-w-md">
        <Lock className="w-16 h-16 text-sf-accent mx-auto mb-4" />
        <h2 className="text-xl font-heading font-bold mb-2">Contenido Premium</h2>
        <p className="text-sf-text-secondary text-sm mb-6">Necesitas un plan superior para ver este contenido.</p>
        <Link to="/subscription" className="btn-primary">Ver planes</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Player */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[1200px] aspect-video">
          {movie.trailer_youtube_id ? (
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailer_youtube_id}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={movie.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center glass rounded-xl">
              <p className="text-sf-text-secondary">Trailer no disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="glass-light py-4 px-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/movie/${id}`)} className="flex items-center gap-2 text-sm text-sf-text-secondary hover:text-sf-text transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver al detalle
            </button>
          </div>
          <h3 className="text-sm font-heading font-semibold">{movie.title}</h3>
        </div>
      </div>
    </div>
  );
}
