import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function CTASection() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  const handleStart = (e) => {
    e.preventDefault()
    navigate('/register')
  }

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden bg-[#03030A]">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.10) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black leading-[1.1] text-white">
            ¿Listo para descubrir{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-white">tu próxima</span>
            </span>{" "}
            película favorita?
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-medium">
            Ingresa tu email para crear una cuenta o reactivar tu membresía hoy mismo.
          </p>

          {/* Email form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto pt-4"
          >
            <div className="bg-gradient-to-r from-white/10 via-gray-400/30 to-white/10 p-[2px] rounded-2xl overflow-hidden shadow-2xl">
              <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-3 bg-black/40 rounded-xl p-3 backdrop-blur-xl">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="flex-1 bg-white/5 px-6 py-4 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 font-medium text-lg"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-white text-black font-black rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-gray-200 text-lg shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                >
                  Comenzar
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-10"
          >
            {[
              "Sin compromiso",
              "Cancela cuando quieras", 
              "Calidad HD y 4K"
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-400 font-semibold">
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                <span>{badge}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
