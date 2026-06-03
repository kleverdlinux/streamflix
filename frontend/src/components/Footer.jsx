import { Play, Github, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-transparent border-t border-white/10 relative z-10">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
              </div>
              <span className="text-xl font-heading font-bold text-white">StreamFlix</span>
            </Link>
            <p className="text-sm text-gray-400">El universo del cine, personalizado para ti con IA.</p>
          </div>
          <div>
            <h4 className="text-sm font-heading font-semibold mb-4 text-white">Explorar</h4>
            <div className="flex flex-col gap-2">
              <Link to="/catalog" className="text-sm text-gray-400 hover:text-white transition-colors">Catálogo</Link>
              <Link to="/for-you" className="text-sm text-gray-400 hover:text-white transition-colors">Para Ti</Link>
              <Link to="/subscription" className="text-sm text-gray-400 hover:text-white transition-colors">Planes</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-heading font-semibold mb-4 text-white">Legal</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">Términos de uso</span>
              <span className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">Privacidad</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-heading font-semibold mb-4 text-white">Síguenos</h4>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Twitter className="w-5 h-5 text-gray-400 hover:text-white transition-colors" /></a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Instagram className="w-5 h-5 text-gray-400 hover:text-white transition-colors" /></a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Github className="w-5 h-5 text-gray-400 hover:text-white transition-colors" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500">© 2026 StreamFlix. Proyecto académico — Sistema de recomendación con IA.</p>
        </div>
      </div>
    </footer>
  );
}
