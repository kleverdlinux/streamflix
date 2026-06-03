import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, TrendingUp, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useMovieStore } from '../stores/movieStore';
import { Check } from 'lucide-react';
import HorizontalScrollRow from '../components/HorizontalScrollRow';


export default function ForYou() {
  const { user } = useAuthStore();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useMovieStore();
  const navigate = useNavigate();
  const [recs, setRecs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [recsRes, trendRes] = await Promise.all([
          api.get('/recommendations/'),
          api.get('/movies/trending/'),
        ]);
        // Handle both formats: {movie:{...}, score:...} and flat movie objects
        const rawRecs = recsRes.data.data || [];
        const recsData = rawRecs.map((r) => {
          if (r.movie && r.movie.id) {
            // Nested format from RecommendationSerializer
            return { ...r.movie, score: r.score };
          }
          // Flat format from fallback
          return { ...r, score: r.score };
        }).filter(m => m.id); // Remove any invalid entries
        setRecs(recsData);
        setTrending(trendRes.data.data || []);

        // Similar to last watched
        if (user) {
          try {
            const histRes = await api.get(`/users/${user.id}/history/`);
            const history = histRes.data.data || [];
            if (history.length > 0) {
              const lastId = history[0].movie?.id;
              if (lastId) {
                const simRes = await api.get(`/recommendations/similar/${lastId}/`);
                setSimilar(simRes.data.data || []);
              }
            }
          } catch (e) {}

          // Genre-based
          try {
            const prefRes = await api.get(`/users/${user.id}/preferences/`);
            const genres = (prefRes.data.data?.genres || []).slice(0, 3);
            const genreData = [];
            for (const g of genres) {
              try {
                const gRes = await api.get(`/movies/by-genre/${g.name.toLowerCase().replace(/\s+/g, '-')}/?page_size=12`);
                if (gRes.data.data?.length) genreData.push({ name: g.name, movies: gRes.data.data });
              } catch (e) {}
            }
            setGenreMovies(genreData);
          } catch (e) {}
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  // Make the hero dynamic: pick a random movie from the top 5 recommendations
  const topRecs = recs.slice(0, 5);
  const topTrending = trending.slice(0, 5);
  
  // Use a stable random based on the current minute or just randomly on load
  const [heroMovie, setHeroMovie] = useState(null);

  const inList = user && heroMovie ? isInWatchlist(heroMovie.id) : false;

  const handleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !heroMovie) return;
    if (inList) {
      removeFromWatchlist(user.id, heroMovie.id);
    } else {
      addToWatchlist(user.id, heroMovie.id);
    }
  };

  useEffect(() => {
    if (recs.length > 0) {
      setHeroMovie(recs[Math.floor(Math.random() * Math.min(5, recs.length))]);
    } else if (trending.length > 0) {
      setHeroMovie(trending[Math.floor(Math.random() * Math.min(5, trending.length))]);
    }
  }, [recs, trending]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
      {/* Hero - identical structure to Catalog */}
      {heroMovie && (
        <div className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden bg-sf-base">
          {/* Background image */}
          <motion.div
            key={heroMovie.id}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <img 
              src={(heroMovie.backdrop_url || heroMovie.poster_url || '').replace('w500', 'original')} 
              alt={heroMovie.title} 
              className="w-full h-full object-cover object-top md:object-right opacity-90"
            />
            {/* HBO Max Gradients: Darken left half heavily, gradient bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-sf-base via-sf-base/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-sf-base via-sf-base/80 to-transparent md:w-[60%]" />
          </motion.div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end pb-24 pt-32 z-10">
            <div className="w-full px-6 md:px-12 lg:px-24">
              <motion.div 
                key={heroMovie.id}
                initial={{ opacity: 0, x: -30 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.8 }}
                className="max-w-xl lg:max-w-2xl"
              >
                {/* AI Pick Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white text-xs font-bold tracking-widest uppercase">Max Original AI Pick</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-tight tracking-tighter text-white">
                  {heroMovie.title}
                </h1>
                
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-bold mb-4 text-gray-300 drop-shadow-md uppercase tracking-widest">
                  {heroMovie.score ? (
                    <span className="text-white">{Math.round(Number(heroMovie.score) > 1 ? Number(heroMovie.score) * 10 : Number(heroMovie.score) * 100)}% COINCIDENCIA IA</span>
                  ) : (
                    <span className="text-white">{90 + (heroMovie.id % 10)}% COINCIDENCIA</span>
                  )}
                  <span className="text-white">{heroMovie.year}</span>
                  <span className="text-white">{heroMovie.duration_min ? `${heroMovie.duration_min} MIN` : '1H 55M'}</span>
                  <span className="text-white">{heroMovie.content_rating || 'PG-13'}</span>
                </div>
                
                {/* Synopsis */}
                <p className="text-sm md:text-base text-gray-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed mb-8 max-w-xl line-clamp-3">
                  <strong className="text-white font-black">{heroMovie.title}: </strong>
                  {heroMovie.description || heroMovie.overview || "Acompaña a nuestros protagonistas en una historia emocionante e inolvidable."}
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mt-10">
                  <button 
                    onClick={() => navigate(`/player/${heroMovie.id}`)}
                    className="bg-white hover:bg-gray-200 text-black font-black text-sm md:text-base px-8 py-3 rounded flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Play className="w-5 h-5 fill-black" /> REPRODUCIR
                  </button>
                  <button 
                    onClick={() => navigate(`/movie/${heroMovie.id}`)}
                    className="bg-[#03030A]/60 hover:bg-white/20 text-white border border-white/20 font-bold text-lg md:text-xl px-8 py-3 md:py-4 rounded-sm flex items-center gap-3 backdrop-blur-md transition-all"
                  >
                    Ver Tráiler
                  </button>
                  <button 
                    onClick={handleWatchlist}
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center backdrop-blur-md transition-all pb-1 ${
                      inList 
                        ? 'border-[#43E97B] text-[#43E97B] bg-[#43E97B]/10 hover:bg-[#43E97B]/20 shadow-[0_0_15px_rgba(67,233,123,0.2)] text-2xl'
                        : 'border-white/50 text-white hover:border-white hover:bg-white/20 text-3xl font-light'
                    }`}
                    title={inList ? "Quitar de mi lista" : "Añadir a mi lista"}
                  >
                    {inList ? <Check className="w-6 h-6 md:w-7 md:h-7" /> : '+'}
                  </button>
                  <button 
                    onClick={() => navigate(`/movie/${heroMovie.id}`)}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/50 flex items-center justify-center text-white hover:border-white hover:bg-white/20 backdrop-blur-md transition-all text-xl font-serif italic"
                    title="Más información"
                  >
                    i
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      <div className="px-8 md:px-16 relative z-20 space-y-12">
        
        {/* Brand Hubs (MAX Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-30">
          {[
            { name: 'Acción', bg: 'bg-gradient-to-br from-red-600 to-black' },
            { name: 'Sci-Fi', bg: 'bg-gradient-to-br from-blue-600 to-black' },
            { name: 'Comedia', bg: 'bg-gradient-to-br from-yellow-500 to-black' },
            { name: 'Drama', bg: 'bg-gradient-to-br from-purple-600 to-black' },
            { name: 'Terror', bg: 'bg-gradient-to-br from-gray-800 to-black' },
            { name: 'Animación', bg: 'bg-gradient-to-br from-pink-500 to-black' }
          ].map((hub, i) => (
            <Link key={i} to={`/catalog?genre=${hub.name.toLowerCase()}`}
              className={`h-24 md:h-32 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/40 hover:scale-105 transition-all shadow-xl group ${hub.bg}`}>
              <span className="font-black text-white/80 group-hover:text-white tracking-widest uppercase text-sm md:text-lg">{hub.name}</span>
            </Link>
          ))}
        </div>

        {/* Cold start banner */}
        {recs.length === 0 && !loading && (
          <div className="bg-gradient-to-br from-sf-secondary to-sf-elevated border border-sf-border rounded-[2rem] p-12 text-center mb-16 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-sf-accent/20 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#00B4D8]/20 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10 max-w-xl mx-auto">
              <div className="w-20 h-20 bg-sf-accent/20 border border-sf-accent/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,212,170,0.3)]">
                <Sparkles className="w-10 h-10 text-sf-accent" />
              </div>
              <h2 className="text-3xl font-black mb-4 text-white">Tu Motor de IA está calibrándose</h2>
              <p className="text-sf-text-secondary text-lg mb-8 leading-relaxed">
                Aún no tenemos suficientes datos sobre tus gustos. Empieza a ver y calificar películas para que nuestro modelo SVD construya tu perfil perfecto.
              </p>
              <Link to="/catalog" className="bg-sf-accent hover:bg-sf-accent-secondary text-[#060611] font-bold text-lg px-8 py-4 rounded-xl inline-flex items-center gap-3 transition-all hover:scale-105">
                Explorar el Catálogo <TrendingUp className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}

        {/* AI Recs */}
        {recs.length > 0 && (
          <HorizontalScrollRow
            title="Sugerencias de nuestro Modelo IA"
            subtitle="Basado en tu actividad reciente y calificaciones"
            movies={recs.slice(0, 15)}
            showMatch
          />
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <HorizontalScrollRow title="Porque viste títulos similares" movies={similar} />
        )}

        {/* Trending */}
        <HorizontalScrollRow
          title="Lo más Top en StreamFlix"
          subtitle="Películas que todos están viendo hoy"
          movies={trending}
        />

        {/* Genre sections */}
        {genreMovies.map((g) => (
          <HorizontalScrollRow key={g.name} title={`Selección especial de ${g.name}`} movies={g.movies} />
        ))}
      </div>
    </motion.div>
  );
}
