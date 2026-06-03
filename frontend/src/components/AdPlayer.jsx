import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ShieldAlert } from 'lucide-react';

export default function AdPlayer({ onComplete }) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Video simulado de anuncio (trailer o comercial usando YouTube en mute para autoplay garantizado) */}
      <div className="absolute inset-0 pointer-events-none">
        <video
          src="https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Etiqueta superior */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-2 bg-[#FFD700] text-black px-4 py-1.5 rounded-sm font-black uppercase tracking-widest text-xs shadow-lg">
        <ShieldAlert className="w-4 h-4" /> Anuncio publicitario
      </div>

      {/* Conteo "El video se reproducirá después del anuncio" */}
      <div className="absolute top-8 right-8 z-10 text-white/50 text-xs uppercase tracking-widest font-bold">
        Tu película comenzará en breve...
      </div>

      {/* Botón de Omitir (Skip) */}
      <div className="absolute bottom-20 right-8 z-10">
        <AnimatePresence mode="wait">
          {!canSkip ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-black/60 backdrop-blur-md text-white border border-white/10 px-6 py-4 rounded-sm text-sm font-bold flex items-center gap-3"
            >
              Puedes omitir en <span className="font-mono font-black text-xl">{timeLeft}</span>
            </motion.div>
          ) : (
            <motion.button
              key="skip"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onComplete}
              className="bg-white/10 hover:bg-white text-white hover:text-black backdrop-blur-md border border-white/30 hover:border-white px-8 py-4 rounded-sm text-sm font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center gap-3 group"
            >
              Omitir Anuncio
              <Play className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de progreso inferior tipo YouTube */}
      <div className="absolute bottom-0 left-0 w-full h-[6px] bg-white/20">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: canSkip ? '100%' : `${((5 - timeLeft) / 5) * 100}%` }} 
          transition={{ ease: "linear", duration: 1 }}
          className="h-full bg-[#FFD700]" 
        />
      </div>
    </div>
  );
}
