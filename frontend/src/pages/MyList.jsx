import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Film } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMovieStore } from '../stores/movieStore';
import MovieCard from '../components/MovieCard';


export default function MyList() {
  const { user } = useAuthStore();
  const { watchlist, fetchWatchlist } = useMovieStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWatchlist(user.id).finally(() => setLoading(false));
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-32 pb-24 bg-sf-base text-sf-text">
      <div className="max-w-[1600px] mx-auto px-6 md:px-16">
        
        <div className="flex items-center gap-4 mb-12 border-b border-sf-border pb-6">
          <div className="w-12 h-12 rounded-xl bg-sf-accent/10 border border-sf-accent/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,170,0.2)]">
            <Bookmark className="w-6 h-6 text-sf-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Mi Lista</h1>
            <p className="text-sm text-sf-text-secondary mt-1">{watchlist.length} películas guardadas</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => <div key={i} className="skeleton w-full rounded-[1.5rem]" style={{ aspectRatio: '2/3' }} />)}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="bg-sf-secondary border border-sf-border rounded-[2rem] p-16 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sf-accent/10 rounded-full blur-[80px]"></div>
            <div className="relative z-10 max-w-md mx-auto">
              <Film className="w-24 h-24 text-sf-text-secondary/30 mx-auto mb-6" />
              <h2 className="text-2xl font-black mb-3 text-white">Tu lista está vacía</h2>
              <p className="text-sf-text-secondary text-base mb-8">
                Aún no has guardado ninguna película. Explora nuestro catálogo y usa el botón "+" para guardar los títulos que quieras ver después.
              </p>
              <Link to="/catalog" className="bg-sf-accent hover:bg-sf-accent-secondary text-[#060611] font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,212,170,0.3)] hover:scale-105 inline-block">
                Explorar Catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {watchlist.map((m, i) => <MovieCard key={m.id} movie={m} index={i} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
