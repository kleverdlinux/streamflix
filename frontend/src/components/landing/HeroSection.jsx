import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState } from "react"
import { Play, ArrowRight, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function HeroSection() {
  const containerRef = useRef(null)
  const [email, setEmail] = useState("")
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  const handleStart = (e) => {
    e.preventDefault()
    const element = document.getElementById("pricing")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden border-b border-sf-border/30"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: 'url(https://i.pinimg.com/736x/10/7e/dc/107edcf1eaad3a125a9f29045b22320a.jpg)' }}
      />

      {/* Gradients to darken the background */}
      <div className="absolute inset-0 bg-sf-base/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-sf-base via-sf-base/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-sf-base/60 via-transparent to-sf-base/30" />

      {/* Main Content (Perfectly Centered like Screenshot 1) */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-32 pb-20 flex flex-col items-center justify-center min-h-[100vh] text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black mb-4 tracking-tighter text-white drop-shadow-2xl"
        >
          StreamFlix
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-8 text-gray-200 drop-shadow-lg"
        >
          Los planes empiezan desde S/ 17.90/mes
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <button
            onClick={() => document.getElementById('planes').scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-black hover:bg-gray-200 font-bold px-10 py-4 text-sm md:text-base tracking-widest shadow-2xl transition-all mb-12 uppercase"
          >
            SUSCRÍBETE AHORA
          </button>
        </motion.div>

        {/* Features Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full max-w-4xl mx-auto mb-10"
        >
          <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-black text-white mb-2">SVD</span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center">MOTOR DE IA</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-black text-white mb-2">98.5%</span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center">AFINIDAD EXACTA</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-black text-white mb-2">0.3s</span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center">PREDICCIÓN RÁPIDA</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-black text-white mb-2">TF-IDF</span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center">ANÁLISIS PROFUNDO</span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-sm md:text-base text-gray-400 max-w-2xl text-center"
        >
          Potenciado por Inteligencia Artificial de vanguardia. Nuestras recomendaciones aprenden de ti para ofrecerte exactamente lo que quieres ver.
        </motion.p>
      </motion.div>
    </section>
  )
}
