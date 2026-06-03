import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Tv, Smartphone, Download, Wifi, Play } from "lucide-react"

const experiences = [
  {
    icon: Tv,
    title: "Disfruta en tu TV",
    description: "Smart TV, PlayStation, Xbox, Chromecast, Apple TV, reproductores Blu-ray y más.",
    visual: "tv"
  },
  {
    icon: Download,
    title: "Descarga y ve offline",
    description: "Guarda tu contenido favorito y tendrás siempre algo que ver, incluso sin internet.",
    visual: "download"
  },
  {
    icon: Smartphone,
    title: "Ve donde quieras",
    description: "Transmite películas y series en tu teléfono, tablet, laptop y TV.",
    visual: "mobile"
  },
  {
    icon: Wifi,
    title: "Calidad adaptativa",
    description: "La mejor calidad posible según tu conexión. Automático y sin interrupciones.",
    visual: "quality"
  }
]

export function ExperienceSection() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section id="experience" ref={containerRef} className="relative py-32 overflow-hidden bg-[#03030A]">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-white/50" />
            <span className="text-white font-black text-sm uppercase tracking-widest">Multiplataforma</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black max-w-3xl leading-tight text-white drop-shadow-md">
            Una experiencia{" "}
            <span className="text-gray-500">sin fricciones</span>
          </h2>
        </motion.div>

        {/* Experiences grid */}
        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`group relative overflow-hidden transition-all duration-500`}
            >
              <div className={`grid lg:grid-cols-2 gap-12 items-center p-8 lg:p-16 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}>
                {/* Content */}
                <div className={`space-y-8 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <exp.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl lg:text-4xl font-black mb-6 text-white">{exp.title}</h3>
                    <p className="text-xl text-gray-400 leading-relaxed font-medium">{exp.description}</p>
                  </div>
                </div>

                {/* Visual */}
                <div className={`relative h-[350px] rounded-3xl overflow-hidden flex items-center justify-center ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  {exp.visual === "tv" && <TvVisual />}
                  {exp.visual === "download" && <DownloadVisual />}
                  {exp.visual === "mobile" && <MobileVisual />}
                  {exp.visual === "quality" && <QualityVisual />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TvVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-[400px]">
        <img src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/tv.png" alt="TV" className="relative z-10 w-full" />
        <div className="absolute top-[21%] left-[13%] w-[73%] h-[54%] bg-black z-0 overflow-hidden">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/video-tv-0819.m4v" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  )
}

function DownloadVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-[300px]">
        <img src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/mobile-0819.jpg" alt="Mobile" className="w-full rounded-2xl" />
        <div className="absolute bottom-[8%] left-[50%] -translate-x-1/2 w-[80%] min-w-[200px] bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-20">
          <img src="https://i.pinimg.com/1200x/88/ed/ab/88edab38ee856b8c52c59a2bdc24dd7a.jpg" className="w-10 h-14 object-cover rounded border border-white/10" alt="Película" />
          <div className="flex-1">
            <p className="font-bold text-sm text-white">Descargando...</p>
            <p className="text-gray-400 text-xs">Película offline</p>
          </div>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}

function MobileVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-[400px]">
        <img src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/device-pile.png" alt="Devices" className="relative z-10 w-full" />
        <div className="absolute top-[10%] left-[18%] w-[63%] h-[47%] bg-black z-0 overflow-hidden">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/video-devices.m4v" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  )
}

function QualityVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-[320px] rounded-3xl overflow-hidden border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
        <img src="https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=800" alt="4K HDR Quality" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03030A] via-[#03030A]/40 to-transparent" />

        {/* Quality indicator UI */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="px-2 py-1 glass rounded text-xs font-bold text-white border border-white/20">4K</span>
            <span className="px-2 py-1 glass rounded text-xs font-bold text-white border border-white/20">HDR</span>
          </div>
          <motion.div
            className="glass px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-white/20 text-white"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            Automático
          </motion.div>
        </div>
      </div>
    </div>
  )
}
