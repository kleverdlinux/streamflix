import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import { useAuthStore } from '../stores/authStore';

let cachedMovies = null;
let cachedGenres = null;

export default function Catalog() {
  const { user, openAuthModal } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedGenre = searchParams.get('genre');
  
  const [movies, setMovies] = useState(cachedMovies || []);
  const [genres, setGenres] = useState(cachedGenres || []);
  const [loading, setLoading] = useState(!cachedMovies || !cachedGenres);

  useEffect(() => {
    const fetchData = async () => {
      if (cachedMovies && cachedGenres) {
        setMovies(cachedMovies);
        setGenres(cachedGenres);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [moviesRes, genresRes] = await Promise.all([
          api.get('/movies/?page_size=1000'),
          api.get('/genres/')
        ]);
        cachedMovies = moviesRes.data.data || [];
        cachedGenres = genresRes.data.data || [];
        setMovies(cachedMovies);
        setGenres(cachedGenres);
      } catch (e) {
        console.error("Error fetching catalog", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group movies by genre for the rows
  const moviesByGenre = useMemo(() => {
    if (!movies.length || !genres.length) return [];
    
    let activeGenres = genres;
    if (selectedGenre) {
      activeGenres = genres.filter(g => g.slug === selectedGenre);
    }
    
    return activeGenres.map(genre => {
      // Find all movies that have this genre
      const genreMovies = movies.filter(movie => 
        movie.genres && movie.genres.some(g => g.slug === genre.slug)
      );
      return {
        ...genre,
        movies: genreMovies
      };
    }).filter(g => g.movies.length > 0); // Only return genres that actually have movies
  }, [movies, genres, selectedGenre]);

  // Featured movies for the Hero Banner (pick top 5 highly rated with backdrops or posters)
  const featuredMovies = useMemo(() => {
    if (!movies.length) return [];
    return movies
      .filter(m => m.backdrop_url || m.poster_url)
      .sort((a, b) => b.weighted_rating - a.weighted_rating)
      .slice(0, 5);
  }, [movies]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredMovies.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featuredMovies]);

  if (loading) {
    return <div className="min-h-screen bg-sf-base flex items-center justify-center text-white">Cargando...</div>;
  }

  const featuredMovie = featuredMovies[currentSlide] || movies[0];

  return (
    <div className="min-h-screen bg-sf-base text-sf-text selection:bg-sf-accent selection:text-[#060611] pb-10">
      
      {/* ══ 1. HERO BANNER OR GUEST HEADER ══ */}
      {user && featuredMovie ? (
        <div key={`auth-hero-${user.id}`} className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden bg-sf-base">
          {/* Background images with crossfade */}
          {featuredMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: currentSlide === index ? 1 : 0 }}
              transition={{ duration: 1.5 }}
            >
              <img 
                src={(movie.backdrop_url || movie.poster_url || '').replace('w500', 'original')} 
                alt={movie.title} 
                className="w-full h-full object-cover object-top md:object-right opacity-90"
              />
              {/* HBO Max Gradients: Darken left half heavily, gradient bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-sf-base via-sf-base/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-sf-base via-sf-base/80 to-transparent md:w-[60%]" />
            </motion.div>
          ))}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end pb-24 pt-32 z-10">
            <div className="w-full px-6 md:px-12 lg:px-24">
              <motion.div 
                key={featuredMovie.id}
                initial={{ opacity: 0, x: -30 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.8 }}
                className="max-w-xl lg:max-w-2xl"
              >
                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-tight tracking-tighter text-white">
                  {featuredMovie.title}
                </h1>
                
                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-bold mb-4 text-gray-300 drop-shadow-md uppercase tracking-widest">
                  <span className="text-white">{90 + (featuredMovie.id % 10)}% COINCIDENCIA</span>
                  <span className="text-white">{featuredMovie.year}</span>
                  <span className="text-white">{featuredMovie.duration_min ? `${featuredMovie.duration_min} MIN` : '1H 55M'}</span>
                  <span className="text-white">{featuredMovie.content_rating || 'PG-13'}</span>
                </div>
                
                {/* Synopsis */}
                <p className="text-sm md:text-base text-gray-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed mb-8 max-w-xl line-clamp-3">
                  <strong className="text-white font-black">{featuredMovie.title}: </strong>
                  {featuredMovie.description || featuredMovie.overview || "Acompaña a nuestros protagonistas en una historia emocionante e inolvidable."}
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mt-10">
                  <button 
                    onClick={() => navigate(`/player/${featuredMovie.id}`)}
                    className="bg-white hover:bg-gray-200 text-black font-black text-sm md:text-base px-8 py-3 rounded flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Play className="w-5 h-5 fill-black" /> REPRODUCIR
                  </button>
                  <button 
                    onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                    className="bg-[#03030A]/60 hover:bg-white/20 text-white border border-white/20 font-bold text-lg md:text-xl px-8 py-3 md:py-4 rounded-sm flex items-center gap-3 backdrop-blur-md transition-all"
                  >
                    Ver Tráiler
                  </button>
                  <button 
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/50 flex items-center justify-center text-white hover:border-white hover:bg-white/20 backdrop-blur-md transition-all text-3xl font-light pb-1"
                    title="Añadir a mi lista"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => navigate(`/movie/${featuredMovie.id}`)}
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
      ) : (
        <div className="pt-40 pb-20 px-6 md:px-16 max-w-[1000px] mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-snug mb-16 tracking-tight">
            Suscríbete, mira películas y disfruta todas las historias que tenemos para ti: acción, dramas y clásicos de la pantalla grande.
          </h1>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            <span className="text-3xl font-black tracking-tighter uppercase text-sf-accent">StreamFlix</span>
            <span className="text-2xl font-bold tracking-tighter uppercase">Originals</span>
            <span className="text-2xl font-bold tracking-widest uppercase">HBO</span>
            <span className="text-2xl font-bold tracking-tighter uppercase">Warner</span>
            <span className="text-2xl font-bold tracking-tighter uppercase">DC</span>
          </div>
        </div>
      )}

      {/* ══ 2. ROWS OF MOVIES ══ */}
      <div className={`px-12 md:px-16 relative z-20 space-y-12 ${user ? 'mt-0' : 'mt-8'}`}>
        {moviesByGenre.map((genre) => (
          <div key={genre.id} className="relative z-20">
            <h2 className="text-2xl font-bold mb-4 text-white hover:text-gray-300 transition-colors cursor-pointer inline-block">
              {genre.name}
            </h2>
            <HorizontalScrollRow movies={genre.movies} />
          </div>
        ))}
      </div>

    </div>
  );
}
