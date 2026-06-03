import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Check, X, Loader2, Sparkles, ChevronRight, ChevronLeft, Film, X as CloseIcon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AuthModal() {
  const { isAuthModalOpen, authModalView, closeAuthModal, openAuthModal, login, selectedPlanForCheckout } = useAuthStore();
  const navigate = useNavigate();

  // Shared state
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Login state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register state
  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirm_password: '' });

  useEffect(() => {
    if (isAuthModalOpen && authModalView === 'register' && genres.length === 0) {
      api.get('/genres/').then(({ data }) => setGenres(data.data || [])).catch(() => {});
    }
  }, [isAuthModalOpen, authModalView, genres.length]);

  const getStrength = (p) => {
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s <= 1 ? 'weak' : s <= 3 ? 'medium' : 'strong';
  };
  const strength = getStrength(registerForm.password);
  const strengthColors = { weak: '#FF6584', medium: '#FFD93D', strong: '#43E97B' };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/', loginForm);
      login(data.data.user, data.data.access, data.data.refresh);
      toast.success('¡Bienvenido de vuelta!');
      closeAuthModal();
      if (selectedPlanForCheckout) {
        window.location.href = '/subscription';
      } else {
        window.location.href = '/catalog';
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNext = () => {
    if (!registerForm.username || !registerForm.email || !registerForm.password) { toast.error('Completa los campos obligatorios'); return; }
    if (registerForm.password !== registerForm.confirm_password) { toast.error('Las contraseñas no coinciden'); return; }
    setStep(2);
  };

  const handleRegisterSubmit = async () => {
    if (selectedGenres.length < 3) { toast.error('Selecciona al menos 3 géneros'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/', { ...registerForm, favorite_genre_ids: selectedGenres });
      login(data.data.user, data.data.access, data.data.refresh);
      toast.success('¡Cuenta creada con éxito!');
      closeAuthModal();
      if (selectedPlanForCheckout) {
        window.location.href = '/subscription';
      } else {
        window.location.href = '/catalog';
      }
    } catch (err) {
      toast.error('Error al registrarse. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={closeAuthModal}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="p-8 md:p-10 rounded-[2rem] bg-black/60 border border-white/10 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sf-accent/40 to-transparent" />
            
            <button onClick={closeAuthModal} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>

            {authModalView === 'login' ? (
              // --- LOGIN VIEW ---
              <>
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-black text-white mb-2">Bienvenido</h1>
                  <p className="text-gray-400 font-medium">Inicia sesión para continuar</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                    <input type="email" placeholder="Correo electrónico" required
                      value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-sf-accent outline-none transition-all focus:bg-white/10" />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                    <input type={showPass ? 'text' : 'password'} placeholder="Contraseña" required
                      value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:border-sf-accent outline-none transition-all focus:bg-white/10" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-sf-accent text-black font-black text-lg py-4 rounded-xl hover:bg-[#00e5b7] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_30px_rgba(0,212,170,0.2)] hover:shadow-[0_0_30px_rgba(0,212,170,0.4)]">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar ahora'}
                  </button>
                </form>

                <p className="text-center text-sm mt-8 text-gray-400">
                  ¿Nuevo en StreamFlix?{' '}
                  <button onClick={() => openAuthModal('register')} className="text-white font-bold hover:text-sf-accent transition-colors underline decoration-white/30 underline-offset-4 hover:decoration-sf-accent">
                    Crea tu cuenta
                  </button>
                </p>
              </>
            ) : (
              // --- REGISTER VIEW ---
              <>
                <div className="flex items-center justify-center mb-8 gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-sf-accent text-black shadow-[0_0_15px_rgba(0,212,170,0.5)]' : 'bg-white/5 text-gray-500 border border-white/10'}`}>1</div>
                  <div className={`w-12 h-1 rounded-full transition-colors ${step === 2 ? 'bg-sf-accent' : 'bg-white/5'}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-sf-accent text-black shadow-[0_0_15px_rgba(0,212,170,0.5)]' : 'bg-white/5 text-gray-500 border border-white/10'}`}>2</div>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                      <div className="text-center mb-6">
                        <h1 className="text-2xl font-black text-white mb-1">Crear perfil</h1>
                        <p className="text-sm text-gray-400">Únete a la evolución del streaming</p>
                      </div>

                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                        <input placeholder="Usuario" value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                      </div>

                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                        <input type="email" placeholder="Correo" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                        <input type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                          {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                        <input type="password" placeholder="Repite contraseña" value={registerForm.confirm_password} onChange={e => setRegisterForm({ ...registerForm, confirm_password: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                      </div>

                      <button onClick={handleRegisterNext} className="w-full bg-white text-black font-black text-lg py-3.5 rounded-xl mt-2 hover:bg-sf-accent hover:text-black transition-all flex items-center justify-center gap-2 group">
                        Siguiente <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="text-center mb-6">
                        <h1 className="text-2xl font-black text-white mb-1">Entrena tu red</h1>
                        <p className="text-sm text-gray-400">Elige 3 géneros para iniciar el modelo</p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {genres.map(g => {
                          const active = selectedGenres.includes(g.id);
                          return (
                            <button key={g.id} onClick={() => setSelectedGenres(p => p.includes(g.id) ? p.filter(id => id !== g.id) : [...p, g.id])}
                              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${
                                active ? 'bg-sf-accent text-black border-sf-accent shadow-[0_0_15px_rgba(0,212,170,0.4)] scale-105' 
                                       : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                              }`}>
                              {g.name}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs font-bold">
                        <span className={selectedGenres.length >= 3 ? 'text-sf-accent' : 'text-gray-500'}>{selectedGenres.length}</span>
                        <span className="text-gray-500">/ 3 seleccionados</span>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button onClick={handleRegisterSubmit} disabled={loading || selectedGenres.length < 3}
                          className="flex-1 bg-sf-accent text-black font-black text-base py-3.5 rounded-xl hover:bg-[#00e5b7] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center shadow-[0_0_20px_rgba(0,212,170,0.4)]">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step === 1 && (
                  <p className="text-center text-sm mt-6 text-gray-400">
                    ¿Ya tienes cuenta? <button onClick={() => openAuthModal('login')} className="text-white font-bold hover:text-sf-accent underline decoration-white/30 hover:decoration-sf-accent transition-colors">Inicia sesión</button>
                  </p>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
