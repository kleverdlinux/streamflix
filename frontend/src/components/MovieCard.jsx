import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Plus, Check, Star } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMovieStore } from '../stores/movieStore';

export default function MovieCard({ movie, index = 0, showMatch = false, matchScore = null }) {
  const { user } = useAuthStore();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useMovieStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const inList = user ? isInWatchlist(movie.id) : false;

  const handleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (inList) {
      removeFromWatchlist(user.id, movie.id);
    } else {
      addToWatchlist(user.id, movie.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, type: 'spring', stiffness: 100 }}
      className="group relative flex-shrink-0 cursor-pointer"
    >
      <Link to={`/movie/${movie.id}`}>
        <motion.div 
          whileHover={{ y: -10, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-[1.5rem] bg-[#12121A] border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_20px_40px_rgba(0,212,170,0.2)] group-hover:border-white/10 transition-all duration-500" 
          style={{ aspectRatio: '2/3' }}
        >
          {/* Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C2A] to-[#12121A] animate-pulse" />
          )}

          {/* Poster */}
          <img
            src={movie.poster_url || `https://via.placeholder.com/300x450/1C1C2A/FFFFFF?text=${encodeURIComponent(movie.title)}`}
            alt={movie.title}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {movie.is_original && (
              <span className="bg-[#E50914] text-white text-[10px] font-black px-2 py-1 rounded-sm tracking-wider shadow-lg">
                ORIGINAL
              </span>
            )}
            {showMatch && matchScore && (
              <span className="bg-[#43E97B]/90 text-black text-xs font-bold px-2 py-1 rounded-md backdrop-blur-md shadow-lg">
                {Math.round(matchScore > 1 ? matchScore * 10 : matchScore * 100)}% match
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5 z-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
            >
              <h3 className="text-lg font-black text-white mb-1 line-clamp-2 leading-tight drop-shadow-lg">{movie.title}</h3>
              
              <div className="flex items-center gap-3 text-xs font-bold text-gray-300 mb-4">
                <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">{movie.year}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#FFD93D] fill-[#FFD93D] drop-shadow-md" />
                  <span>{Number(movie.avg_rating).toFixed(1)}</span>
                </div>
                {movie.content_rating && (
                  <span className="border border-white/20 px-1.5 py-0.5 rounded text-[10px]">{movie.content_rating}</span>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/player/${movie.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black font-black text-xs hover:bg-[#00D4AA] hover:text-[#060611] transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,212,170,0.5)]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Ver
                </Link>
                <button
                  onClick={handleWatchlist}
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                    inList
                      ? 'border-[#43E97B] text-[#43E97B] bg-[#43E97B]/10 shadow-[0_0_15px_rgba(67,233,123,0.2)]'
                      : 'border-white/20 text-white hover:border-white hover:bg-white/10'
                  }`}
                >
                  {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
