import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Smartphone, CreditCard, Landmark, X, Film, Loader2, Receipt, Lock, Download, Share2, Mail } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';

const plans = [
  { id: 1, name: 'Gratuito', priceMonthly: 0, priceAnnual: 0, features: ['Catálogo limitado', 'Con anuncios', '1 dispositivo', 'Calidad SD', 'Sin descargas'] },
  { id: 2, name: 'Básico', priceMonthly: 17.90, priceAnnual: 11.90, features: ['Catálogo completo', 'Sin anuncios', '2 dispositivos', 'Calidad HD', 'Sin descargas'] },
  { id: 3, name: 'Intermedio', priceMonthly: 26.90, priceAnnual: 17.90, features: ['Catálogo completo', 'Sin anuncios', '3 dispositivos', 'Calidad Full HD', 'Descargas offline'] },
  { id: 4, name: 'Premium', priceMonthly: 35.90, priceAnnual: 23.90, features: ['Todo incluido', 'Sin anuncios', '5 dispositivos', 'Calidad 4K HDR', 'Descargas + Estrenos'] },
];

export default function Subscription() {
  const { user, plan, updateUser, selectedPlanForCheckout, clearSelectedPlanForCheckout } = useAuthStore();
  const [showModal, setShowModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('yape');
  const [checkoutStep, setCheckoutStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [txnId, setTxnId] = useState('');
  const [isAnnual, setIsAnnual] = useState(false);
  const receiptRef = useRef(null);

  const currentPlanId = plan?.id || 1;

  useEffect(() => {
    if (selectedPlanForCheckout) {
      setIsAnnual(!!selectedPlanForCheckout.isAnnual);
      const matchedPlan = plans.find(p => p.id === selectedPlanForCheckout.id);
      if (matchedPlan) {
        setShowModal(matchedPlan);
        setCheckoutStep('form');
      }
      clearSelectedPlanForCheckout();
    }
  }, [selectedPlanForCheckout, clearSelectedPlanForCheckout]);

  const getPlanPrice = (p) => {
    return isAnnual ? p.priceAnnual : p.priceMonthly;
  };

  const handlePayment = async () => {
    setCheckoutStep('processing');
    
    // Simular procesamiento bancario
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      await api.put(`/auth/me/`, { plan_id: showModal.id });
      updateUser({ plan_name: showModal.name, plan_id: showModal.id });
      
      setTxnId(`TXN-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setCheckoutStep('success');
    } catch (e) { 
      toast.error('Hubo un error al procesar el pago.'); 
      setCheckoutStep('form');
    }
  };

  const closeCheckout = () => {
    setShowModal(null);
    setCheckoutStep('form');
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#F4F4F5' });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `boleta-streamflix-${txnId}.png`;
      link.href = image;
      link.click();
      toast.success('Boleta descargada exitosamente.');
    } catch (e) {
      toast.error('Error al generar la imagen de la boleta.');
    }
  };

  const handleShareReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#F4F4F5' });
      canvas.toBlob(async (blob) => {
        if (!blob) return toast.error('Error al generar la imagen.');
        
        const file = new File([blob], `boleta-streamflix-${txnId}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Boleta Electrónica StreamFlix',
              text: `Adjunto mi boleta de pago de StreamFlix por el plan ${showModal?.name}.`,
              files: [file]
            });
            toast.success('Compartido exitosamente');
          } catch (err) {
            console.log('Cancelado o error compartiendo', err);
          }
        } else {
          toast.success('Tu navegador no soporta compartir imágenes. Usa el botón Descargar.', { icon: 'ℹ️' });
        }
      }, 'image/png');
    } catch (e) {
      toast.error('Error al procesar la boleta para compartir.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-24 pb-10">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black mb-4">Potencia tu experiencia</h1>
          <p className="text-sf-text-secondary text-lg">Actualiza tu plan con los métodos de pago locales favoritos</p>
        </div>

        {/* Toggle Facturación (Mensual/Anual) estilo HBO Max */}
        <div className="flex justify-center items-center gap-4 mb-12 relative z-20">
          <div className="relative bg-white/5 border border-white/10 p-1.5 rounded-full flex items-center">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                !isAnnual ? "text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {!isAnnual && (
                <motion.div
                  layoutId="subBillingActive"
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
                  layoutId="subBillingActive"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((p, i) => {
            const isCurrent = p.id === currentPlanId;
            const isPremium = p.id === 4;
            const currentPrice = getPlanPrice(p);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass rounded-2xl p-6 flex flex-col relative transition-all duration-300 hover:-translate-y-2 ${
                  isCurrent ? 'border-sf-accent glow-primary' : isPremium ? 'border-yellow-400/30' : ''
                }`}>
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-sf-accent text-[#060611] text-xs font-bold shadow-[0_0_15px_rgba(0,212,170,0.4)]">
                    Tu plan actual
                  </span>
                )}
                {isPremium && <Crown className="w-6 h-6 text-yellow-400 mb-2" />}
                <h3 className="text-xl font-black">{p.name}</h3>
                <div className="my-4">
                  <span className="text-4xl font-black">S/ {currentPrice}</span>
                  <span className="text-sm text-sf-text-secondary font-bold"> /mes</span>
                  {isAnnual && p.id > 1 && (
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      Cobrado anualmente (S/ {(currentPrice * 12).toFixed(2)})
                    </p>
                  )}
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                      <div className="bg-[#43E97B]/10 p-1 rounded-full">
                        <Check className="w-3 h-3 text-[#43E97B]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button disabled className="w-full py-3 rounded-xl bg-white/5 text-white/50 font-bold cursor-not-allowed">
                    Plan actual
                  </button>
                ) : (
                  <button onClick={() => { setShowModal(p); setCheckoutStep('form'); }} 
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105 ${
                      isPremium ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-yellow-500/20' 
                                : 'bg-sf-accent text-[#060611] shadow-sf-accent/20'
                    }`}>
                    Elegir {p.name}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060611]/90 backdrop-blur-lg px-4 p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {checkoutStep === 'form' && (
                <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-4xl bg-[#0C0C1D] border border-sf-accent/20 rounded-3xl shadow-[0_0_50px_rgba(0,212,170,0.1)] overflow-hidden flex flex-col md:flex-row relative">
                  
                  {/* Order Summary (Left) */}
                  <div className="w-full md:w-1/3 bg-gradient-to-b from-[#12121A] to-[#0A0A14] p-8 border-r border-white/5 relative flex flex-col justify-between">
                    <button onClick={closeCheckout} className="absolute top-4 left-4 text-sf-text-secondary hover:text-white md:hidden">
                      <X className="w-6 h-6" />
                    </button>
                    <div className="mt-8 md:mt-0">
                      <h3 className="text-sf-text-secondary text-xs uppercase tracking-widest font-black mb-2 flex items-center gap-2"><Receipt className="w-4 h-4"/> Resumen</h3>
                      <p className="text-3xl font-black text-white mb-8">Plan {showModal.name}</p>
                      
                      <div className="space-y-5 mb-8">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Ciclo</span>
                          <span className="bg-white/10 text-white px-3 py-1 rounded-full font-bold text-xs">{isAnnual ? 'Anual' : 'Mensual'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Subtotal</span>
                          <span className="text-white font-mono">
                            S/ {isAnnual ? (getPlanPrice(showModal) * 12).toFixed(2) : getPlanPrice(showModal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">IGV (18%)</span>
                          <span className="text-white font-mono text-xs text-gray-500">Incluido</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full my-4"></div>
                        <div className="flex justify-between items-end">
                          <span className="text-white font-black text-sm uppercase tracking-wider">Total</span>
                          <span className="text-sf-accent font-black text-2xl font-mono">
                            S/ {isAnnual ? (getPlanPrice(showModal) * 12).toFixed(2) : getPlanPrice(showModal)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-sf-accent/10 border border-sf-accent/20 p-4 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sf-accent/20 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-sf-accent" />
                      </div>
                      <p className="text-[10px] text-gray-300 font-medium leading-relaxed">Conexión segura encriptada con cifrado militar SSL 256-bit.</p>
                    </div>
                  </div>

                  {/* Payment Methods (Right) */}
                  <div className="w-full md:w-2/3 p-8 relative bg-[#0C0C1D]">
                    <button onClick={closeCheckout} className="absolute top-4 right-4 text-sf-text-secondary hover:text-white hidden md:block transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                    
                    <h2 className="text-2xl font-black mb-8 text-white flex items-center gap-2">Selecciona un método</h2>
                    
                    <div className="grid grid-cols-3 gap-4 mb-10">
                      <button onClick={() => setPaymentMethod('yape')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${paymentMethod === 'yape' ? 'border-[#742284] bg-[#742284]/10 text-[#742284] shadow-[0_0_20px_rgba(116,34,132,0.2)] scale-105' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'}`}>
                        <Smartphone className="w-8 h-8" />
                        <span className="text-xs font-black tracking-wide">YAPE / PLIN</span>
                      </button>
                      <button onClick={() => setPaymentMethod('card')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${paymentMethod === 'card' ? 'border-sf-accent bg-sf-accent/10 text-sf-accent shadow-[0_0_20px_rgba(0,212,170,0.2)] scale-105' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'}`}>
                        <CreditCard className="w-8 h-8" />
                        <span className="text-xs font-black tracking-wide">TARJETA</span>
                      </button>
                      <button onClick={() => setPaymentMethod('transfer')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${paymentMethod === 'transfer' ? 'border-[#00B4D8] bg-[#00B4D8]/10 text-[#00B4D8] shadow-[0_0_20px_rgba(0,180,216,0.2)] scale-105' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'}`}>
                        <Landmark className="w-8 h-8" />
                        <span className="text-xs font-black tracking-wide">BANCO</span>
                      </button>
                    </div>

                    <div className="h-[280px]">
                      <AnimatePresence mode="wait">
                        {/* Yape Form */}
                        {paymentMethod === 'yape' && (
                          <motion.div key="yape" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center">
                            <div className="w-40 h-40 bg-white rounded-2xl p-3 flex items-center justify-center shadow-[0_0_30px_rgba(116,34,132,0.3)] mb-6 relative">
                              <div className="absolute inset-0 rounded-2xl border-2 border-[#742284] animate-pulse"></div>
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=StreamFlix_${showModal.name}_Monto_${isAnnual ? (getPlanPrice(showModal) * 12).toFixed(2) : getPlanPrice(showModal)}`} alt="QR Yape" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-gray-300 text-center text-sm px-4">Escanea para pagar o transfiere directamente al número:</p>
                            <p className="font-mono text-[#742284] text-xl font-black mt-2 tracking-widest bg-[#742284]/10 px-6 py-2 rounded-xl border border-[#742284]/20">987 654 321</p>
                          </motion.div>
                        )}

                        {/* Card Form */}
                        {paymentMethod === 'card' && (
                          <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 h-full pt-4">
                            <div className="relative group">
                              <input type="text" id="card-num" placeholder=" " maxLength="19" className="peer w-full px-4 pt-6 pb-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent focus:bg-white/10 outline-none transition-all font-mono tracking-widest text-lg" />
                              <label htmlFor="card-num" className="absolute left-4 top-4 text-xs font-bold text-gray-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-sf-accent">Número de Tarjeta</label>
                              <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-600 peer-focus:text-sf-accent transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                              <div className="relative group">
                                <input type="text" id="card-exp" placeholder=" " maxLength="5" className="peer w-full px-4 pt-6 pb-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent focus:bg-white/10 outline-none transition-all font-mono text-lg" />
                                <label htmlFor="card-exp" className="absolute left-4 top-4 text-xs font-bold text-gray-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-sf-accent">Venc. (MM/YY)</label>
                              </div>
                              <div className="relative group">
                                <input type="password" id="card-cvv" placeholder=" " maxLength="4" className="peer w-full px-4 pt-6 pb-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sf-accent focus:bg-white/10 outline-none transition-all font-mono text-lg" />
                                <label htmlFor="card-cvv" className="absolute left-4 top-4 text-xs font-bold text-gray-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-sf-accent">CVV</label>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                              <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] font-black text-white/50">VISA</div>
                              <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] font-black text-white/50">MC</div>
                              <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] font-black text-white/50">AMEX</div>
                            </div>
                          </motion.div>
                        )}

                        {/* Transfer Form */}
                        {paymentMethod === 'transfer' && (
                          <motion.div key="transfer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full pt-4">
                            <div className="bg-[#00B4D8]/5 border border-[#00B4D8]/30 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(0,180,216,0.1)]">
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00B4D8]/20 rounded-full blur-3xl pointer-events-none"></div>
                              <p className="text-sm text-white font-bold mb-6 relative z-10">Cuentas Corporativas StreamFlix</p>
                              <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Cuenta BCP</span>
                                  <span className="font-mono font-bold text-[#00B4D8] text-lg tracking-widest">191-2384729-0-45</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">CCI Interbancario</span>
                                  <span className="font-mono font-bold text-[#00B4D8] text-lg tracking-widest">002-191-12384729045-56</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-8">
                      <button 
                        onClick={handlePayment} 
                        className="w-full py-4 rounded-2xl font-black text-lg bg-sf-accent text-[#060611] hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-[0_0_30px_rgba(0,212,170,0.4)] hover:shadow-[0_0_40px_rgba(255,255,255,0.6)]"
                      >
                        Pagar S/ {isAnnual ? (getPlanPrice(showModal) * 12).toFixed(2) : getPlanPrice(showModal)}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Processing State */}
              {checkoutStep === 'processing' && (
                <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                  className="bg-[#0C0C1D] border border-sf-accent/30 p-12 rounded-3xl flex flex-col items-center justify-center shadow-[0_0_100px_rgba(0,212,170,0.2)]">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-sf-accent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-sf-accent animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-wide">Procesando Transacción</h3>
                  <p className="text-gray-400">Estableciendo conexión segura con el banco...</p>
                </motion.div>
              )}

              {/* Virtual Receipt State (Success) */}
              {checkoutStep === 'success' && (
                <motion.div key="success" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                  className="w-full max-w-[340px] bg-[#F4F4F5] text-[#1A1A1A] relative shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col font-mono text-sm mx-auto">
                  
                  {/* Contenedor que será capturado por html2canvas */}
                  <div ref={receiptRef} className="w-full relative bg-[#F4F4F5] pb-2">
                    {/* Top Sawtooth Edge */}
                    <svg className="absolute -top-[10px] left-0 w-full h-[10px] text-[#F4F4F5] fill-current" preserveAspectRatio="none" viewBox="0 0 100 10">
                      <polygon points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10 100,10 0,10" />
                    </svg>
                    
                    <div className="px-6 pt-10 pb-4 flex flex-col items-center">
                      <div className="w-14 h-14 bg-black text-sf-accent rounded-full flex items-center justify-center mb-4 shadow-xl">
                        <Film className="w-7 h-7" />
                      </div>
                      <h2 className="text-2xl font-black tracking-[0.2em] uppercase mb-1">StreamFlix</h2>
                      <p className="text-[10px] text-gray-500 mb-8 text-center uppercase tracking-widest leading-relaxed">
                        Recibo Electrónico<br/>Comprobante Válido
                      </p>

                      <div className="w-full space-y-4 mb-8">
                        <div className="flex justify-between border-b border-gray-300 border-dashed pb-2">
                          <span className="text-gray-500">FECHA</span>
                          <span className="font-bold">{new Date().toLocaleString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 border-dashed pb-2">
                          <span className="text-gray-500">TRANSAC.</span>
                          <span className="font-bold">{txnId}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 border-dashed pb-2">
                          <span className="text-gray-500">MÉTODO</span>
                          <span className="font-bold uppercase">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 border-dashed pb-2">
                          <span className="text-gray-500">PLAN</span>
                          <span className="font-bold uppercase">{showModal.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-300 border-dashed pb-2">
                          <span className="text-gray-500">CICLO</span>
                          <span className="font-bold uppercase">{isAnnual ? 'ANUAL' : 'MENSUAL'}</span>
                        </div>
                      </div>

                      <div className="w-full flex justify-between items-end border-b-2 border-black pb-4 mb-8">
                        <span className="text-lg font-black uppercase">Total</span>
                        <span className="text-3xl font-black">S/ {isAnnual ? (getPlanPrice(showModal) * 12).toFixed(2) : getPlanPrice(showModal)}</span>
                      </div>

                      <div className="flex flex-col items-center gap-2 mb-4 w-full bg-green-100 py-3 rounded-lg border border-green-200">
                        <Check className="w-6 h-6 text-green-600" />
                        <span className="font-black text-green-700 tracking-widest text-lg">APROBADO</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción y botón de cierre, FUERA del área que se captura para que no salgan en la imagen */}
                  <div className="px-6 pb-8 flex flex-col items-center">
                    <div className="flex gap-2 w-full mb-6">
                      <button onClick={handleDownloadReceipt} className="flex-1 bg-white border border-gray-300 text-black py-3 rounded-lg flex flex-col items-center justify-center gap-1 font-bold hover:bg-gray-100 hover:-translate-y-0.5 transition-all shadow-sm">
                        <Download className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-wider">Descargar</span>
                      </button>
                      <button onClick={handleShareReceipt} className="flex-1 bg-white border border-gray-300 text-black py-3 rounded-lg flex flex-col items-center justify-center gap-1 font-bold hover:bg-gray-100 hover:-translate-y-0.5 transition-all shadow-sm">
                        <Share2 className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-wider">Compartir</span>
                      </button>
                    </div>

                    <button onClick={closeCheckout} className="w-full bg-black text-white font-black py-4 uppercase tracking-widest hover:bg-gray-800 hover:scale-105 transition-all shadow-xl">
                      Cerrar Comprobante
                    </button>
                  </div>

                  {/* Bottom Sawtooth Edge */}
                  <svg className="absolute -bottom-[10px] left-0 w-full h-[10px] text-[#F4F4F5] fill-current" preserveAspectRatio="none" viewBox="0 0 100 10">
                    <polygon points="0,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0 100,0 0,0" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
      <Footer />
    </motion.div>
  );
}
