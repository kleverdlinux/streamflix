import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Check, Star, Clock, Globe, Calendar, ThumbsUp, ThumbsDown, Info, Film } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useMovieStore } from '../stores/movieStore';
import RatingStars from '../components/RatingStars';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useMovieStore();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeTab, setActiveTab] = useState('similar');
  const [matchScore, setMatchScore] = useState(null);
  const [myRating, setMyRating] = useState({ rating: 0, liked: null, review: '' });
  const [submitting, setSubmitting] = useState(false);
  const { openAuthModal } = useAuthStore();
  const inList = user && movie ? isInWatchlist(movie.id) : false;

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);
    api.get(`/movies/${id}/`).then(({ data }) => setMovie(data.data)).catch(() => {});
    api.get(`/movies/${id}/ratings/`).then(({ data }) => setReviews(data.data || [])).catch(() => {});
    api.get(`/movies/${id}/similar/`).then(({ data }) => setSimilar(data.data || [])).catch(() => {});
    api.get(`/movies/trending/`).then(({ data }) => setTrending(data.data || [])).catch(() => {});
    if (user) {
      api.get(`/recommendations/match-score/${id}/`).then(({ data }) => setMatchScore(data.data)).catch(() => {});
    }
  }, [id, user]);

  const handleRate = async (overrides = {}) => {
    const payload = { ...myRating, ...overrides };
    if (!payload.rating) { toast.error('Selecciona una calificación'); return; }
    setSubmitting(true);
    try {
      await api.post(`/movies/${id}/rate/`, payload);
      setMyRating(payload);
      toast.success('¡Calificación registrada!');
      api.get(`/movies/${id}/ratings/`).then(({ data }) => setReviews(data.data || []));
    } catch (e) { toast.error('Error al calificar'); }
    finally { setSubmitting(false); }
  };

  // Auto-save like/dislike immediately to DB (no need to click Enviar separately)
  const handleLike = async (liked) => {
    const newRating = myRating.rating || 4; // default 4 stars if no rating set yet
    const payload = { ...myRating, liked, rating: newRating };
    setMyRating(payload);
    setSubmitting(true);
    try {
      await api.post(`/movies/${id}/rate/`, payload);
      toast.success(liked ? '¡Te gustó! Recomendaciones actualizadas.' : 'Anotado. La IA aprende de tu feedback.');
      api.get(`/movies/${id}/ratings/`).then(({ data }) => setReviews(data.data || []));
    } catch (e) { toast.error('Error al registrar'); }
    finally { setSubmitting(false); }
  };

  if (!movie) return (
    <div className="min-h-screen bg-sf-base pt-20 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-sf-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const people = movie.people || { actors: [], directors: [] };
  const fallbackBackdrop = `https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070`;
  const bgImage = (movie.backdrop_url || movie.poster_url || fallbackBackdrop).replace('w500', 'original');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-sf-base text-sf-text">
      
      {/* ══ 1. HERO SECTION (HBO Max Style) ══ */}
      <section className="relative w-full min-h-[85vh] md:min-h-screen flex flex-col justify-end pb-12 pt-32">
        {/* Full Bleed Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bgImage}
            alt={movie.title}
            className="w-full h-full object-cover object-top md:object-right opacity-90"
          />
          {/* HBO Max Gradients: Darken left half heavily, gradient bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-sf-base via-sf-base/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-sf-base via-sf-base/80 to-transparent md:w-[60%]" />
        </div>

        <div className="relative z-10 px-6 md:px-12 lg:px-24 w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-xl lg:max-w-2xl">
            
            {/* Original Badge */}
            {movie.is_original && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white text-xs font-bold tracking-widest uppercase">StreamFlix Original</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-tight tracking-tighter text-white">
              {movie.title}
            </h1>

            {/* Metadata Row (HBO Max style: Match, Year, Genre, Rating) */}
            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-bold mb-4 text-gray-300 drop-shadow-md uppercase tracking-widest">
              {matchScore ? (
                <span className="text-white">{Math.round(matchScore.probability * 100)}% COINCIDENCIA</span>
              ) : (
                <span className="text-white">RECOMENDADO</span>
              )}
              <span className="text-white">{movie.year}</span>
              <span className="text-white">{movie.duration_min ? `${movie.duration_min} MIN` : '1H 55M'}</span>
              <span className="text-white">{movie.content_rating || 'PG-13'}</span>
            </div>

            {/* Synopsis */}
            <p className="text-sm md:text-base text-gray-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-relaxed mb-8 max-w-xl line-clamp-3">
              <strong className="text-white font-black">{movie.title}: </strong>
              {movie.description || "Acompaña a nuestros protagonistas en una aventura sin igual donde descubrirán secretos ocultos."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-10">
              {user ? (
                <>
                  <Link 
                    to={`/player/${movie.id}`} 
                    className="bg-white hover:bg-gray-200 text-black font-black text-sm md:text-base px-8 py-3 rounded flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Play className="w-5 h-5 fill-black" /> REPRODUCIR
                  </Link>
                  
                  <Link 
                    to={`/player/${movie.id}`} 
                    className="bg-[#03030A]/60 hover:bg-white/20 text-white border border-white/20 font-bold text-lg md:text-xl px-8 py-3 md:py-4 rounded-sm flex items-center gap-3 backdrop-blur-md transition-all"
                  >
                    Ver Tráiler
                  </Link>

                  <button 
                    onClick={() => inList ? removeFromWatchlist(user.id, movie.id) : addToWatchlist(user.id, movie.id)}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/50 flex items-center justify-center text-white hover:border-white hover:bg-white/20 backdrop-blur-md transition-all group"
                    title={inList ? 'Quitar de Mi Lista' : 'Añadir a Mi Lista'}
                  >
                    {inList ? <Check className="w-6 h-6 md:w-8 md:h-8" /> : <Plus className="w-6 h-6 md:w-8 md:h-8" />}
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('about')}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/50 flex items-center justify-center text-white hover:border-white hover:bg-white/20 backdrop-blur-md transition-all group"
                    title="Calificar / Detalles"
                  >
                    <Info className="w-6 h-6 md:w-7 md:h-7" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => openAuthModal('register')}
                    className="bg-white hover:bg-gray-200 text-black font-black text-sm md:text-base px-8 py-3 rounded transition-all transform hover:scale-105 shadow-lg uppercase tracking-wider"
                  >
                    SUSCRÍBETE AHORA
                  </button>
                  
                  <button 
                    onClick={() => { window.location.href = '/#pricing' }}
                    className="bg-transparent hover:bg-white/10 text-white border border-white font-bold text-sm md:text-base px-8 py-3 rounded backdrop-blur-md transition-all uppercase tracking-wider"
                  >
                    VER PLANES
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

       {/* ══ 2. TABS SECTION (MAX Style) ══ */}
      <section className="max-w-[1600px] mx-auto px-6 md:px-16 pb-20 relative z-20">
        
        {/* TABS */}
        <div className="flex justify-center gap-8 md:gap-16 text-xs md:text-sm font-bold tracking-widest uppercase mb-12 border-b border-sf-border/30 pb-4 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('similar')} 
            className={`transition-colors whitespace-nowrap ${activeTab === 'similar' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Quizá también te guste
          </button>
          <button 
            onClick={() => setActiveTab('trending')} 
            className={`transition-colors whitespace-nowrap ${activeTab === 'trending' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            En tendencia
          </button>
          <button 
            onClick={() => setActiveTab('about')} 
            className={`transition-colors whitespace-nowrap ${activeTab === 'about' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Sobre la Película
          </button>
          <button 
            onClick={() => setActiveTab('reviews')} 
            className={`transition-colors whitespace-nowrap ${activeTab === 'reviews' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Comunidad
          </button>
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          
          {activeTab === 'similar' && (
            <motion.div key="similar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {similar.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {similar.slice(0, 12).map((m) => (
                    <Link key={m.id} to={`/movie/${m.id}`} className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 hover:border-white/50 transition-all">
                      <img src={m.poster_url || fallbackBackdrop} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-10">No hay recomendaciones disponibles para esta película.</p>
              )}
            </motion.div>
          )}

          {activeTab === 'trending' && (
            <motion.div key="trending" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trending.slice(0, 12).map((m) => (
                  <Link key={m.id} to={`/movie/${m.id}`} className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 hover:border-white/50 transition-all">
                    <img src={m.poster_url || fallbackBackdrop} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-12">
              
              {/* Información Técnica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Director</h3>
                  <p className="text-white text-lg">{people.directors?.length > 0 ? people.directors.map(d => d.name).join(', ') : 'No especificado'}</p>
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Géneros</h3>
                  <div className="flex flex-wrap gap-2">
                    {(movie.genres || []).map(g => (
                      <span key={g.id} className="text-white text-lg">{g.name}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Audio</h3>
                  <p className="text-white text-lg capitalize">{movie.language || 'Español'}</p>
                </div>
              </div>

              {/* Elenco */}
              {people.actors?.length > 0 && (
                <div>
                  <h3 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-4">Elenco</h3>
                  <div className="flex flex-wrap gap-6">
                    {people.actors.slice(0, 10).map((a) => (
                      <div key={a.id} className="text-center w-24">
                        <div className="w-20 h-20 mx-auto rounded-full bg-sf-elevated overflow-hidden mb-3 border border-sf-border">
                          {a.photo_url ? (
                            <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl bg-[#1C1C2E]">{a.name[0]}</div>
                          )}
                        </div>
                        <p className="text-sm font-bold text-white line-clamp-1">{a.name}</p>
                        {a.character_name && <p className="text-xs text-gray-500 line-clamp-1">{a.character_name}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calificaciones (Solo usuarios logueados) */}
              {user && (
                <div id="rating-section" className="bg-[#03030A] p-6 rounded-xl border border-white/10 mt-8">
                  <h3 className="text-lg font-bold mb-4 text-white">Valora esta película</h3>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <RatingStars value={myRating.rating} onChange={(v) => setMyRating({ ...myRating, rating: v })} />
                    <div className="flex gap-3">
                      {/* Like/Dislike auto-guardan en la DB inmediatamente */}
                      <button
                        onClick={() => handleLike(true)}
                        disabled={submitting}
                        title="Me gustó — se guarda automáticamente"
                        className={`p-3 rounded-full transition-all ${myRating.liked === true ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                        <ThumbsUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleLike(false)}
                        disabled={submitting}
                        title="No me gustó — se guarda automáticamente"
                        className={`p-3 rounded-full transition-all ${myRating.liked === false ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                        <ThumbsDown className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 flex gap-2 w-full mt-4 md:mt-0">
                      <input type="text" placeholder="Escribe una reseña (opcional)..." value={myRating.review}
                        onChange={(e) => setMyRating({ ...myRating, review: e.target.value })}
                        className="flex-1 bg-transparent border-b border-white/30 px-2 py-2 text-white focus:border-white outline-none" />
                      <button onClick={() => handleRate()} disabled={submitting} className="bg-white text-black font-black px-6 py-2 rounded-sm transition-colors hover:bg-gray-200">
                        {submitting ? '...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
              <h3 className="text-xl font-bold mb-6 text-white">Reseñas de la Comunidad</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r, i) => (
                    <div key={i} className="p-5 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sf-accent/20 flex items-center justify-center text-sf-accent font-bold text-lg">
                            {r.username ? r.username[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{r.username || 'Usuario'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-yellow-400 text-xs font-mono font-bold">★ {Number(r.rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        {r.liked !== null && (
                          <div className={`p-2 rounded-full ${r.liked ? 'bg-[#43E97B]/20 text-[#43E97B]' : 'bg-red-500/20 text-red-500'}`}>
                            {r.liked ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                          </div>
                        )}
                      </div>
                      {r.review && <p className="text-gray-300 text-sm leading-relaxed">{r.review}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-10 text-center bg-white/5 rounded-xl border border-white/10">Aún no hay reseñas para esta película. ¡Sé el primero en opinar!</p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </section>
      <Footer />
    </motion.div>
  );
}
