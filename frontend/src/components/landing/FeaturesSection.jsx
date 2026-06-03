import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Brain, Zap, Target, Layers } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Motor Híbrido SVD",
    description: "Combinamos Filtrado Colaborativo con Análisis de Contenido para predecir exactamente qué película te fascinará.",
    stat: "98.7%",
    statLabel: "Precisión"
  },
  {
    icon: Zap,
    title: "Predicción en Tiempo Real",
    description: "Calculamos un porcentaje de afinidad exacto para cada título basado en tu perfil único.",
    stat: "0.3s",
    statLabel: "Latencia"
  },
  {
    icon: Target,
    title: "Procesamiento de Lenguaje",
    description: "Analizamos sinopsis, reseñas y géneros para entender profundamente cada trama.",
    stat: "15M+",
    statLabel: "Películas analizadas"
  },
  {
    icon: Layers,
    title: "Aprendizaje Continuo",
    description: "Cada interacción refina tu perfil cinematográfico para recomendaciones cada vez mejores.",
    stat: "24/7",
    statLabel: "Evolución constante"
  }
]

export function FeaturesSection() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section id="features" ref={containerRef} className="relative py-32 overflow-hidden bg-[#03030A]">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-white/5 blur-[100px]" />
      </div>

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
            <span className="text-white font-black text-sm uppercase tracking-widest">Tecnología SVD</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black max-w-3xl leading-tight text-white drop-shadow-md">
            Inteligencia artificial{" "}
            <span className="text-gray-500">que comprende tu gusto</span>
          </h2>
        </motion.div>

        {/* Features grid - Bento style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`group relative rounded-[2rem] p-8 bg-black hover:bg-[#0a0a0a] transition-all duration-500 border border-white/20 hover:border-white/60 flex flex-col justify-between`}
            >
              <div>
                {/* Icon */}
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-medium text-sm lg:text-base">{feature.description}</p>
                </div>
              </div>

              {/* Stat */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex flex-col xl:flex-row xl:items-baseline gap-2">
                  <span className="text-3xl lg:text-4xl font-black text-white">{feature.stat}</span>
                  <span className="text-xs lg:text-sm font-semibold text-gray-400">{feature.statLabel}</span>
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative rounded-[2rem] overflow-hidden bg-black p-8 lg:p-16 border border-white"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h3 className="text-3xl lg:text-4xl font-black text-white leading-tight">
                Cómo funciona nuestro motor de recomendaciones
              </h3>
              <div className="space-y-6">
                {[
                  { step: "01", text: "Analizamos tu historial de visualización" },
                  { step: "02", text: "Identificamos patrones en tus preferencias" },
                  { step: "03", text: "Comparamos con usuarios similares" },
                  { step: "04", text: "Generamos recomendaciones personalizadas" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-4 bg-transparent p-4 rounded-xl border border-white/10"
                  >
                    <span className="text-lg font-black text-white font-mono">{item.step}</span>
                    <span className="text-gray-300 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Visual representation */}
            <div className="relative h-[350px] md:h-[450px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <img
                src="https://i.pinimg.com/736x/a0/61/81/a061816721aebd2be0fb2c3f2d3f3658.jpg"
                alt="AI Core Visualization"
                className="w-full h-full object-cover opacity-80 mix-blend-screen grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#03030A] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />

              <div className="absolute bottom-6 left-6 right-6 bg-black p-4 rounded-xl border border-white shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Pipeline SVD + TF-IDF Activo</div>
                    <div className="text-xs text-gray-400 font-mono mt-1">Procesando 15M+ nodos de datos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
