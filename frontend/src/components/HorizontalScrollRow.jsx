import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

export default function HorizontalScrollRow({ title, subtitle, movies, showMatch = false }) {
  const scrollRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section
      className="relative mb-10"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      {/* Header */}
      <div className="mb-4 px-1">
        <h2 className="text-xl font-heading font-bold text-sf-text">{title}</h2>
        {subtitle && <p className="text-sm text-sf-text-secondary mt-1">{subtitle}</p>}
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        {showArrows && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-r from-sf-base to-transparent hover:from-sf-base/90 transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-sf-text" />
          </button>
        )}

        {/* Movies */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth px-1 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {movies.map((movie, i) => (
            <div key={movie.id} className="w-[180px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
              <MovieCard movie={movie} index={i} showMatch={showMatch} matchScore={movie.score} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        {showArrows && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-l from-sf-base to-transparent hover:from-sf-base/90 transition-all"
          >
            <ChevronRight className="w-6 h-6 text-sf-text" />
          </button>
        )}
      </div>
    </section>
  );
}
