import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Check, X, Loader2, Film, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '' });

  // Parallax background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const springY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 40);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 40);
    };
    window.addEventListener('mousemove', handleMouseMove);
    api.get('/genres/').then(({ data }) => setGenres(data.data || [])).catch(() => {});
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const getStrength = (p) => {
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s <= 1 ? 'weak' : s <= 3 ? 'medium' : 'strong';
  };
  const strength = getStrength(form.password);
  const strengthColors = { weak: '#FF6584', medium: '#FFD93D', strong: '#43E97B' };

  const handleNext = () => {
    if (!form.username || !form.email || !form.password) { toast.error('Completa los campos obligatorios'); return; }
    if (form.password !== form.confirm_password) { toast.error('Las contraseñas no coinciden'); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (selectedGenres.length < 3) { toast.error('Selecciona al menos 3 géneros'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/', { ...form, favorite_genre_ids: selectedGenres });
      login(data.data.user, data.data.access, data.data.refresh);
      toast.success('¡Cuenta creada con éxito!');
      navigate('/catalog');
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(err.response?.data?.message || 'Error al registrarse. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black selection:bg-sf-accent selection:text-white pt-10 pb-10">
      {/* ══ PARALLAX BACKGROUND ══ */}
      <motion.div className="absolute inset-[-5%] w-[110%] h-[110%]" style={{ x: springX, y: springY }}>
        <img 
          src="https://assets.nflxext.com/ffe/siteui/vlv3/93da5c27-be66-427c-8b72-5cb39d275279/94eb5ad7-10d8-4cca-bf45-ac52e0a052c0/US-en-20240226-popsignuptwoweeks-perspective_alpha_website_large.jpg" 
          alt="Cinematic Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen" 
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px]" />
      </motion.div>

      {/* Logo at Top Left */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 z-50 hover:scale-105 transition-transform">
        <Film className="w-8 h-8 text-sf-accent" />
        <span className="text-3xl font-black text-white tracking-tight">StreamFlix</span>
      </Link>

      {/* Glows */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-sf-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-sf-accent-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[500px] relative z-10"
      >
        <div className="p-10 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sf-accent/30 to-transparent" />

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-10 gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-sf-accent text-black shadow-[0_0_15px_rgba(0,212,170,0.5)]' : 'bg-white/5 text-gray-500 border border-white/10'}`}>1</div>
            <div className={`w-16 h-1 rounded-full transition-colors ${step === 2 ? 'bg-sf-accent' : 'bg-white/5'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-sf-accent text-black shadow-[0_0_15px_rgba(0,212,170,0.5)]' : 'bg-white/5 text-gray-500 border border-white/10'}`}>2</div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-black text-white mb-2">Crear tu perfil</h1>
                  <p className="text-gray-400 font-medium">Únete a la evolución del streaming</p>
                </div>

                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                  <input placeholder="Usuario" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                  <input type="email" placeholder="Correo" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                  <input type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {form.password && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%', background: strengthColors[strength] }} />
                    </div>
                  </div>
                )}

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
                  <input type="password" placeholder="Repite contraseña" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:border-sf-accent focus:bg-white/10 outline-none transition-all" />
                  {form.confirm_password && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {form.password === form.confirm_password ? <Check className="w-5 h-5 text-sf-accent" /> : <X className="w-5 h-5 text-[#FF6584]" />}
                    </span>
                  )}
                </div>

                <button onClick={handleNext} className="w-full bg-white text-black font-black text-lg py-4 rounded-xl mt-4 hover:bg-sf-accent hover:text-black transition-all flex items-center justify-center gap-2 group">
                  Siguiente paso <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center mb-8">
                  <Sparkles className="w-10 h-10 mx-auto text-sf-accent mb-4" />
                  <h1 className="text-3xl font-black text-white mb-2">Entrena tu red</h1>
                  <p className="text-gray-400 font-medium">Elige 3 géneros para iniciar el modelo</p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                  {genres.map(g => {
                    const active = selectedGenres.includes(g.id);
                    return (
                      <button key={g.id} onClick={() => setSelectedGenres(p => p.includes(g.id) ? p.filter(id => id !== g.id) : [...p, g.id])}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                          active ? 'bg-sf-accent text-black border-sf-accent shadow-[0_0_15px_rgba(0,212,170,0.4)] scale-105' 
                                 : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                        }`}>
                        {g.name}
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-center gap-2 mb-6 text-sm font-bold">
                  <span className={selectedGenres.length >= 3 ? 'text-sf-accent' : 'text-gray-500'}>{selectedGenres.length}</span>
                  <span className="text-gray-500">/ 3 seleccionados</span>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button onClick={handleSubmit} disabled={loading || selectedGenres.length < 3}
                    className="flex-1 bg-sf-accent text-black font-black text-lg py-4 rounded-xl hover:bg-[#00e5b7] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center shadow-[0_0_20px_rgba(0,212,170,0.4)]">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Finalizar e Ingresar'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <p className="text-center text-sm mt-8 text-gray-400">
              ¿Ya tienes cuenta? <Link to="/login" className="text-white font-bold hover:text-sf-accent underline decoration-white/30 hover:decoration-sf-accent transition-colors">Inicia sesión</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
