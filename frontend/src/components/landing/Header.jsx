import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { useState } from "react"
import { Play, Menu, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"

const navLinks = [
  { label: "INICIO", href: "/" },
  { label: "PELÍCULAS", href: "/catalog" },
  { label: "PLANES", href: "/#pricing" },
  { label: "TECNOLOGÍA IA", href: "/#features" },
  { label: "DISPOSITIVOS", href: "/#experience" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const { openAuthModal } = useAuthStore()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const handleNavLinkClick = (e, href) => {
    if (window.location.pathname === '/') {
      if (href.startsWith('/#')) {
        const id = href.replace('/#', '');
        const element = document.getElementById(id);
        if (element) {
          e.preventDefault();
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', href);
        }
      } else if (href === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
      }
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#03030A]/75 backdrop-blur-md border-b border-white/10 py-4 shadow-lg" : "py-6"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
              </div>
              <span className="text-2xl font-bold text-white hidden sm:block">StreamFlix</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={(e) => handleNavLinkClick(e, link.href)}
                  className="text-sm font-medium text-sf-text-secondary hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => openAuthModal('login')}
                className="hidden sm:block text-sm font-black text-white hover:text-gray-300 transition-colors tracking-wide"
              >
                INGRESA
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-6 py-2 bg-white text-black text-sm font-black rounded-sm transition-all hover:bg-gray-200 uppercase tracking-wide shadow-lg"
              >
                Suscríbete ahora
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-sf-elevated transition-colors text-white"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{
          height: isMobileMenuOpen ? "auto" : 0,
          opacity: isMobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-0 right-0 z-40 bg-[#03030A]/90 backdrop-blur-md overflow-hidden md:hidden border-b border-white/10 shadow-2xl"
      >
        <nav className="p-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                handleNavLinkClick(e, link.href);
              }}
              className="block text-lg font-medium text-sf-text-secondary hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-sf-border flex flex-col gap-4">
            <button
              onClick={() => { setIsMobileMenuOpen(false); openAuthModal('login'); }}
              className="block text-left text-lg font-medium text-white transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </nav>
      </motion.div>
    </>
  )
}
