import { Link, useLocation } from 'react-router-dom';
import { m, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { Menu, X, ChevronRight, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Essays', path: '/articles' },
    { name: 'Projects', path: '/projects' },
    { name: 'Upstream', path: '/upstream' },
    { name: 'About', path: '/about' },
  ];

  const menuVariants = {
    closed: {
      clipPath: 'circle(0px at calc(100% - 40px) 40px)',
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      clipPath: 'circle(150% at calc(100% - 40px) 40px)',
      transition: {
        type: 'spring' as const,
        stiffness: 20,
        restDelta: 2,
      },
    },
  };

  const linkVariants = {
    closed: { x: 50, opacity: 0 },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1 + 0.2,
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    }),
  };

  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:block group will-change-transform">
        <div className="relative p-[1px] rounded-full bg-gradient-to-r from-zinc-800/50 via-zinc-600/50 to-zinc-800/50 group-hover:from-electric-lime/40 group-hover:via-emerald-500/40 group-hover:to-electric-lime/40 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(204,255,0,0.15)]">
          <div className={`liquid-glass bd-stable rounded-full px-6 py-2 flex items-center gap-7 transition-colors duration-500 ${scrolled ? 'bg-black/80 shadow-lg' : 'bg-black/40'}`}>
            {links.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative block rounded-md text-xs uppercase tracking-widest font-mono transition-colors duration-300 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime ${
                    isActive ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <m.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              aria-label="Open command palette"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] tracking-widest text-zinc-400 hover:border-electric-lime/50 hover:text-electric-lime transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime"
            >
              <Search size={11} aria-hidden="true" />
              <span>⌘K</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="fixed top-6 right-6 z-50 md:hidden liquid-orb bd-stable rounded-full p-3 text-zinc-300 hover:text-electric-lime transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col justify-between overflow-y-auto px-8 pt-24 pb-10"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              className="fixed top-6 right-6 p-3 border border-zinc-800/50 rounded-full text-zinc-400 hover:text-electric-lime transition-colors bg-zinc-900/50"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col gap-5 w-full max-w-sm mx-auto my-auto">
              <m.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-4 border-b border-zinc-800/50 pb-4"
              >
                Navigation
              </m.p>
              
              {links.map((link, i) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <m.div
                    key={link.name}
                    custom={i}
                    variants={linkVariants}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center justify-between text-3xl md:text-4xl font-display font-medium transition-colors duration-300 ${
                        isActive ? 'text-electric-lime' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronRight 
                        size={28} 
                        className={`transition-transform duration-300 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} 
                      />
                    </Link>
                  </m.div>
                );
              })}
              <m.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="pt-4"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new Event('open-command-palette'));
                  }}
                  className="w-full flex items-center justify-between rounded-2xl liquid-glass px-4 py-3 font-mono text-xs uppercase tracking-widest text-zinc-300 hover:border-electric-lime/50 hover:text-electric-lime transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Search size={14} aria-hidden="true" />
                    Quick jump
                  </span>
                  <span className="text-[10px] text-zinc-500">⌘K</span>
                </button>
              </m.div>
            </div>
            
            <m.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-sm mx-auto text-center border-t border-zinc-800/50 pt-6 mt-8"
            >
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                adityaai.dev
              </p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
