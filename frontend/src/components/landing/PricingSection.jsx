import { motion, useInView } from "framer-motion"
import { Check, Crown, Sparkles } from "lucide-react"
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"

const plans = [
  {
    id: 1,
    name: "Gratuito",
    priceMonthly: "0.00",
    priceAnnual: "0.00",
    periodMonthly: "/mes",
    periodAnnual: "/mes",
    description: "Recomendaciones básicas",
    features: [
      "Calidad SD",
      "1 dispositivo",
      "Acceso gratuito",
      "Con anuncios",
    ],
    cta: "Empezar Gratis",
    popular: false,
    color: "from-gray-700 to-gray-900",
    accent: "text-gray-400"
  },
  {
    id: 2,
    name: "Básico",
    priceMonthly: "17.90",
    priceAnnual: "11.90",
    periodMonthly: "/mes",
    periodAnnual: "/mes",
    annuallyBilled: "Facturado S/ 142.80 al año",
    description: "Lo esencial sin anuncios",
    features: [
      "Calidad HD",
      "2 dispositivos simultáneos",
      "Sin anuncios",
      "Catálogo completo",
    ],
    cta: "Elegir Básico",
    popular: false,
    color: "from-gray-600 to-gray-800",
    accent: "text-gray-300"
  },
  {
    id: 3,
    name: "Intermedio",
    priceMonthly: "26.90",
    priceAnnual: "17.90",
    periodMonthly: "/mes",
    periodAnnual: "/mes",
    annuallyBilled: "Facturado S/ 214.80 al año",
    description: "La experiencia compartida",
    features: [
      "Calidad Full HD",
      "3 dispositivos simultáneos",
      "Sin anuncios",
      "Lista personal ilimitada",
    ],
    cta: "Elegir Intermedio",
    popular: true,
    color: "from-gray-300 to-gray-500",
    accent: "text-white"
  },
  {
    id: 4,
    name: "Premium",
    priceMonthly: "35.90",
    priceAnnual: "23.90",
    periodMonthly: "/mes",
    periodAnnual: "/mes",
    annuallyBilled: "Facturado S/ 286.80 al año",
    description: "Máxima calidad e IA",
    features: [
      "Calidad 4K Ultra HD",
      "4 dispositivos simultáneos",
      "Descargas offline",
      "IA de recomendación prioritaria",
      "Sin anuncios",
    ],
    cta: "Elegir Premium",
    popular: false,
    color: "from-gray-800 to-black",
    accent: "text-gray-400"
  },
]

export function PricingSection() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const navigate = useNavigate()
  const { user, openAuthModal, setSelectedPlanForCheckout } = useAuthStore()
  const [isAnnual, setIsAnnual] = useState(false)

  const handleSelectPlan = (plan) => {
    const selectedPlan = {
      id: plan.id,
      name: plan.name,
      price: isAnnual ? plan.priceAnnual : plan.priceMonthly,
      isAnnual: isAnnual,
    }
    
    setSelectedPlanForCheckout(selectedPlan)
    
    if (user) {
      navigate('/subscription')
    } else {
      openAuthModal('register')
    }
  }

  return (
    <section id="pricing" ref={containerRef} className="relative py-32 overflow-hidden bg-[#03030A]">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full bg-white/5 blur-[150px] -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-6 justify-center w-full">
            <div className="h-px w-12 bg-white/50" />
            <span className="text-white font-black text-sm uppercase tracking-widest">Suscripciones</span>
            <div className="h-px w-12 bg-white/50" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white drop-shadow-lg">
            Elige tu plan perfecto
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Sin compromisos. Cancela en cualquier momento. Cambia de plan cuando quieras.
          </p>
        </motion.div>

        {/* Toggle Facturación (Mensual/Anual) estilo HBO Max */}
        <div className="flex justify-center items-center gap-4 mb-16 relative z-20">
          <div className="relative bg-white/5 border border-white/10 p-1.5 rounded-full flex items-center">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                !isAnnual ? "text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {!isAnnual && (
                <motion.div
                  layoutId="billingActive"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                isAnnual ? "text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {isAnnual && (
                <motion.div
                  layoutId="billingActive"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              Anual
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                isAnnual ? "bg-black text-white" : "bg-white/10 text-white"
              }`}>
                Ahorra 33%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {plans.map((plan, index) => {
            const currentPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly
            const currentPeriod = isAnnual ? plan.periodAnnual : plan.periodMonthly
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative group rounded-[2rem] p-[2px] transition-all duration-500 hover:-translate-y-2 ${
                  plan.popular 
                    ? "shadow-[0_0_40px_rgba(255,255,255,0.15)] z-10" 
                    : "z-0"
                }`}
              >
                {/* Animated border if popular, else simple border */}
                {plan.popular ? (
                  <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-gradient-to-br from-white via-gray-400 to-black" />
                ) : (
                  <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-b ${plan.color} opacity-30`} />
                )}

                <div className="relative h-full bg-black/40 rounded-[1.9rem] p-8 lg:p-10 flex flex-col backdrop-blur-xl">
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-sm font-black tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        <Crown className="w-4 h-4" />
                        MÁS POPULAR
                      </div>
                    </div>
                  )}

                  {/* Plan name */}
                  <div className="mb-6">
                    <h3 className={`text-3xl font-black mb-2 ${plan.accent}`}>{plan.name}</h3>
                    <p className="text-gray-400 font-medium">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-end gap-1">
                      <span className="text-lg font-black text-white mb-6 mr-1">S/</span>
                      <span className="text-5xl lg:text-6xl font-black text-white">{currentPrice}</span>
                      <span className="text-xl text-sf-text-secondary mb-1 font-medium">
                        {currentPeriod}
                      </span>
                    </div>
                    {/* Annually billed text indicator */}
                    {isAnnual && plan.annuallyBilled && (
                      <p className="text-xs text-gray-400 font-bold mt-2 animate-fadeIn">
                        {plan.annuallyBilled}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-5 mb-10 flex-1">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 + index * 0.1 + i * 0.05 }}
                        className="flex items-center gap-4"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          plan.popular ? "bg-white/20" : "bg-white/5 border border-white/10"
                        }`}>
                          <Check className={`w-4 h-4 ${plan.popular ? "text-white" : "text-gray-400"}`} />
                        </div>
                        <span className="font-medium text-white">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 text-lg shadow-lg ${
                      plan.popular
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/20"
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center text-sf-text-secondary mt-16 font-medium text-lg"
        >
          Todos los planes incluyen acceso completo a nuestro motor de recomendaciones con Inteligencia Artificial.
        </motion.p>
      </div>
    </section>
  )
}
