import { motion } from 'framer-motion';

const movies = [
  {
    id: 1,
    title: 'Superman',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
    year: '2025'
  },

  {
    id: 2,
    title: 'A Minecraft Movie',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg',
    year: '2025'
  },

  {
    id: 3,
    title: 'Avatar: Fire and Ash',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/aabwWZWx6z1aYP4PX2ADvbDKktd.jpg',
    year: '2025'
  },

  {
    id: 4,
    title: 'Furiosa',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    year: '2024'
  },

  {
    id: 5,
    title: 'Kingdom of the Planet of the Apes',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    year: '2024'
  },

  {
    id: 6,
    title: 'Alien: Romulus',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/2uSWRTtCG336nuBiG8jOTEUKSy8.jpg',
    year: '2024'
  },

  {
    id: 7,
    title: 'Backrooms',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/vpkNMkbisv5cTaIfCzUduYzXnjb.jpg',
    year: '2026'
  },

  {
    id: 8,
    title: 'The Mandalorian & Grogu',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/5Vi8dSauVwH1HOsiZceDMbRr1Ca.jpg',
    year: '2026'
  },

  {
    id: 9,
    title: 'Deadpool & Wolverine',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    year: '2024'
  },

  {
    id: 10,
    title: 'Dune: Part Two',
    poster: 'https://media.themoviedb.org/t/p/w600_and_h900_face/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    year: '2024'
  },
];

export function TrendingSection() {
  const n = movies.length;

  return (
    <section className="py-32 relative overflow-hidden bg-sf-base">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] bg-sf-accent/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-sf-accent/10 border border-sf-accent/20 text-sf-accent font-bold text-sm tracking-widest mb-6"
          >
            LO MÁS VISTO
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-white mb-0 tracking-tight"
          >
            Tendencias <span className="text-transparent bg-clip-text bg-gradient-to-r from-sf-accent to-purple-500">2025 - 2026</span>
          </motion.h2>
        </div>
      </div>

      <div className="pb-10 pt-0 flex justify-center w-full relative z-10">
        <style>
          {`
            .scene {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100vw;
              max-width: 100%;
              height: 480px;
              overflow: hidden;
              perspective: 1600px;
              -webkit-mask: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
              mask: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
            }
            .carousel-3d {
              display: grid;
              place-items: center;
              transform-style: preserve-3d;
              animation: panCarousel 60s linear infinite;
            }
            .carousel-3d:hover {
              animation-play-state: paused;
            }
            @keyframes panCarousel {
              to { transform: rotateY(-1turn); }
            }
            .card-3d {
              grid-area: 1/1;
              width: 320px;
              aspect-ratio: 7/10;
              object-fit: cover;
              border-radius: 16px;
                backface-visibility: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                cursor: pointer;
              }
            `}
        </style>

        <div className="scene">
          <div className="carousel-3d">
            {movies.map((movie, i) => {
              const cardWidth = 320; // px
              const ba = 360 / n;
              const rad = (ba / 2) * (Math.PI / 180);
              const tz = (cardWidth / 2) / Math.tan(rad);

              return (
                <img
                  key={movie.id}
                  src={movie.poster}
                  alt={movie.title}
                  className="card-3d"
                  style={{
                    transform: `rotateY(${i * ba}deg) translateZ(-${tz + 40}px)`,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
