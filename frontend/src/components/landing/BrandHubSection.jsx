import { useState, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"

const brands = [
  {
    name: "HBO",
    tagline: "El hogar de las series más galardonadas y aclamadas por la crítica.",
    logo: "HBO",
    themeColor: "from-blue-900/30 to-slate-900/80",
    bgImage: "https://i.pinimg.com/736x/9b/ba/58/9bba58250d91dfc906d3846511179064.jpg",
    titles: ["House of the Dragon", "Succession", "The Wire"]
  },
  {
    name: "DC",
    tagline: "El universo definitivo de superhéroes, villanos y novelas gráficas legendarias.",
    logo: "DC",
    themeColor: "from-indigo-950/30 to-blue-950/80",
    bgImage: "https://i1-e.pinimg.com/1200x/6b/05/ef/6b05efdf93d0d396177bc1594b3a1ffe.jpg",
    titles: ["The Batman", "Joker", "Zack Snyder's Justice League"]
  },
  {
    name: "Warner Bros",
    tagline: "Cien años de magia cinematográfica, desde grandes clásicos hasta sagas memorables.",
    logo: "Warner Bros",
    themeColor: "from-amber-950/30 to-stone-950/80",
    bgImage: "https://i1-e.pinimg.com/1200x/62/3f/6e/623f6efe905ce2c66084d8ec9cdaa2dd.jpg",
    titles: ["Harry Potter", "Dune: Part Two", "Interstellar"]
  },
  {
    name: "Max Originals",
    tagline: "Producciones exclusivas y audaces creadas especialmente para nuestra plataforma.",
    logo: "Max Originals",
    themeColor: "from-fuchsia-950/30 to-violet-950/80",
    bgImage: "https://media.themoviedb.org/t/p/w600_and_h900_face/tNQWO6cNzQYCyvw36mUcAQQyf5F.jpg",
    titles: ["The Last of Us", "Euphoria", "Hacks"]
  },
  {
    name: "Cartoon Network",
    tagline: "Las mejores series animadas para todas las edades y los clásicos nostálgicos.",
    logo: "Cartoon Network",
    themeColor: "from-neutral-900/30 to-black/80",
    bgImage: "https://i1-e.pinimg.com/736x/79/0d/4c/790d4c747ef68e97311a1afec1d3ddef.jpg",
    titles: ["Hora de Aventura", "El Increíble Mundo de Gumball", "Ben 10"]
  },
  {
    name: "Discovery",
    tagline: "Documentales cautivadores, ciencia, naturaleza y entretenimiento de la vida real.",
    logo: "Discovery",
    themeColor: "from-teal-950/30 to-cyan-950/80",
    bgImage: "https://i1-e.pinimg.com/1200x/3b/96/a4/3b96a433e54854d65dde3e2f83a02669.jpg",
    titles: ["Planet Earth III", "Aventura en Pelotas", "Hermanos a la Obra"]
  }
]

export function BrandHubSection() {
  const [activeIdx, setActiveIdx] = useState(0)
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  const currentBrand = brands[activeIdx]

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden bg-sf-base border-t border-white/5">
      {/* Background Poster Image with Zoom and Blur Transition */}
      <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBrand.name}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentBrand.bgImage})` }}
          />
        </AnimatePresence>
        {/* Overlays to darken the scene */}
        <div className="absolute inset-0 bg-[#03030A]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03030A] via-[#03030A]/90 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6 justify-center w-full">
            <div className="h-px w-12 bg-white/50" />
            <span className="text-white font-black text-sm uppercase tracking-widest">El Catálogo Definitivo</span>
            <div className="h-px w-12 bg-white/50" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white drop-shadow-lg leading-tight">
            Tus marcas favoritas, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sf-accent to-purple-500">en un solo lugar</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Explora producciones aclamadas de los mejores estudios y creadores del mundo.
          </p>
        </motion.div>

        {/* Brand Selector Row - Estilo HBO Max Hub */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-16">
          {brands.map((brand, i) => {
            const isActive = i === activeIdx
            return (
              <button
                key={brand.name}
                onClick={() => setActiveIdx(i)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`relative group rounded-2xl p-6 flex flex-col items-center justify-center min-h-[100px] border transition-all duration-500 overflow-hidden ${isActive
                  ? "bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-105"
                  : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5"
                  }`}
              >
                {/* Brand Name Text (Stylized like logos) */}
                <span className={`text-lg md:text-xl font-black tracking-wider transition-colors duration-300 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"
                  }`}>
                  {brand.name}
                </span>

                {/* Animated underlight on active */}
                {isActive && (
                  <motion.div
                    layoutId="brandUnderlight"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sf-accent to-purple-500"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Brand Details Showcase */}
        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-2xl p-8 lg:p-16 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black tracking-widest text-sf-accent uppercase inline-block">
                  Destacado de {currentBrand.name}
                </span>
                <h3 className="text-4xl lg:text-5xl font-black text-white leading-none font-heading">
                  {currentBrand.name}
                </h3>
                <p className="text-lg md:text-xl text-gray-300 font-medium leading-relaxed">
                  {currentBrand.tagline}
                </p>
              </div>

              {/* Display Titles list */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Títulos más populares:</h4>
                <div className="flex flex-wrap gap-3">
                  {currentBrand.titles.map((title, i) => (
                    <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:bg-white/10 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-sf-accent" />
                      {title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Graphic: Mock Poster / Art Cards Stack */}
            <div className="relative h-[250px] md:h-[350px] w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBrand.name}
                  initial={{ opacity: 0, x: 50, rotate: 3 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: -50, rotate: -3 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full max-w-[450px] h-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] group"
                >
                  <img
                    src={currentBrand.bgImage}
                    alt={currentBrand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]"
                  />
                  {/* Subtle vignette gradient inside poster */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                  {/* Play tag overlay */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10">
                    <div>
                      <div className="text-xs font-bold text-sf-accent uppercase tracking-widest">Ahora disponible</div>
                      <div className="text-sm font-black text-white mt-1">{currentBrand.titles[0]}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
