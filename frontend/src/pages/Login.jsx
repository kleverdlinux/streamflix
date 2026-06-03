import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Film, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Parallax background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const springY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/', form);
      login(data.data.user, data.data.access, data.data.refresh);
      toast.success('¡Bienvenido de vuelta!');
      navigate('/catalog');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black selection:bg-sf-accent selection:text-white">
      {/* ══ PARALLAX BACKGROUND ══ */}
      <motion.div 
        className="absolute inset-[-5%] w-[110%] h-[110%]" 
        style={{ x: springX, y: springY }}
      >
        <img 
          src="https://assets.nflxext.com/ffe/siteui/vlv3/a73c4363-1dcd-412e-8a3f-3afe07c2d78a/cf47d6ba-d5b4-4e94-8bf2-088e14674f17/MX-es-20231009-popsignuptwoweeks-perspective_alpha_website_large.jpg" 
          alt="Cinematic Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen" 
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
      </motion.div>

      {/* Logo at Top Left */}
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 z-50 hover:scale-105 transition-transform">
        <Film className="w-8 h-8 text-sf-accent" />
        <span className="text-3xl font-black text-white tracking-tight">StreamFlix</span>
      </Link>

      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sf-accent/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sf-accent-secondary/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      {/* ══ LOGIN PANEL ══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="p-10 md:p-12 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sf-accent/40 to-transparent" />
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-2">Bienvenido</h1>
            <p className="text-gray-400 font-medium">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
              <input type="email" placeholder="Correo electrónico" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-sf-accent outline-none transition-all focus:bg-white/10 focus:shadow-[0_0_20px_rgba(0,212,170,0.15)]" />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-sf-accent transition-colors" />
              <input type={showPass ? 'text' : 'password'} placeholder="Contraseña" required
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:border-sf-accent outline-none transition-all focus:bg-white/10 focus:shadow-[0_0_20px_rgba(0,212,170,0.15)]" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm py-2">
              <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors group">
                <div className="relative flex items-center justify-center w-4 h-4 rounded border border-gray-600 group-hover:border-gray-400 bg-transparent">
                  <input type="checkbox" className="absolute opacity-0 cursor-pointer w-full h-full" />
                  <Check className="w-3 h-3 text-sf-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                Recordarme
              </label>
              <a href="#" className="text-sf-accent font-semibold hover:text-white transition-colors">
                ¿Olvidaste la contraseña?
              </a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-sf-accent text-black font-black text-lg py-4 rounded-xl hover:bg-[#00e5b7] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_30px_rgba(0,212,170,0.2)] hover:shadow-[0_0_30px_rgba(0,212,170,0.4)]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar ahora'}
            </button>
          </form>

          <p className="text-center text-sm mt-8 text-gray-400">
            ¿Nuevo en StreamFlix?{' '}
            <Link to="/register" className="text-white font-bold hover:text-sf-accent transition-colors underline decoration-white/30 underline-offset-4 hover:decoration-sf-accent">
              Crea tu cuenta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
