import { motion, useInView, AnimatePresence } from "framer-motion"
import { useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "¿Qué es StreamFlix?",
    answer: "StreamFlix es un servicio de streaming de última generación impulsado por IA. Ofrece una amplia variedad de películas, series y documentales. Lo que nos diferencia es nuestro Motor Híbrido SVD que aprende de tus gustos para ofrecerte recomendaciones extremadamente precisas y personalizadas."
  },
  {
    question: "¿Cómo funciona el motor de recomendaciones con IA?",
    answer: "Nuestro motor híbrido SVD combina Filtrado Colaborativo (lo que usuarios con gustos idénticos disfrutan) con Análisis de Contenido (géneros, actores, directores, tramas). Además, procesamos con Lenguaje Natural (NLP) las sinopsis y reseñas para entender profundamente la historia de cada título."
  },
  {
    question: "¿Cuánto cuesta StreamFlix?",
    answer: "Tenemos planes desde S/ 0.00 (Gratuito, con anuncios y catálogo limitado) hasta S/ 35.90/mes (o S/ 23.90/mes contratado de manera anual) para nuestra experiencia Premium con 4K Ultra HD, 4 pantallas simultáneas e IA de recomendación prioritaria. Puedes cambiar o cancelar tu plan en cualquier momento sin cargos de cancelación."
  },
  {
    question: "¿Dónde puedo ver StreamFlix?",
    answer: "¡Prácticamente en cualquier lugar! StreamFlix está disponible en smart TVs, PlayStation, Xbox, Chromecast, Apple TV, navegadores web, teléfonos (iOS y Android) y tablets. También puedes descargar contenido para verlo offline donde vayas."
  },
  {
    question: "¿Cómo cancelo mi suscripción?",
    answer: "StreamFlix es flexible. No hay contratos ni compromisos molestos. Puedes cancelar tu cuenta online fácilmente con dos clics. Si cancelas, tu cuenta permanecerá activa hasta el final de tu período de facturación actual."
  }
]

export function FAQSection() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden bg-black border-t border-white/5">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6 justify-center w-full">
            <div className="h-px w-12 bg-white/50" />
            <span className="text-white font-black text-sm uppercase tracking-widest">Soporte</span>
            <div className="h-px w-12 bg-white/50" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white drop-shadow-md">
            Preguntas frecuentes
          </h2>
          <p className="text-xl text-gray-400 font-medium">
            Todo lo que necesitas saber sobre la plataforma.
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border-b border-white/10"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full py-6 text-left flex items-center justify-between gap-4 group transition-colors duration-300"
              >
                <h3 className="text-xl md:text-2xl font-bold text-white transition-colors duration-300 group-hover:text-gray-300 leading-snug">
                  {faq.question}
                </h3>
                <ChevronDown className={`w-6 h-6 text-white transition-transform duration-300 shrink-0 ${
                  openIndex === index ? "rotate-180" : ""
                }`} />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-base md:text-lg text-gray-400 font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
