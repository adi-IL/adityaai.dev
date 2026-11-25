import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ScrollToTop from './components/ScrollToTop';
import VirtualCoffeePopup from './components/VirtualCoffeePopup';
import FloatingCoffeeButton from './components/FloatingCoffeeButton';
import FloatingChatButton from './components/FloatingChatButton';
import CommandPalette from './components/CommandPalette';
import { Toast, ToastDescription, ToastRegion, ToastTitle } from '@ui-sdk/react/toast';

// Lazy load secondary routes and heavy overlays so home keeps vendor-markdown off the critical path
const Articles = lazy(() => import('./pages/Articles'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const About = lazy(() => import('./pages/About'));
const Upstream = lazy(() => import('./pages/Upstream'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SiteChatWidget = lazy(() => import('./components/SiteChatWidget'));

// Lazy load heavy Three.js backgrounds (desktop fine-pointer without reduced-motion only)
const AtmosphericBackground = lazy(() => import('./components/AtmosphericBackground'));
const NetworkBackground = lazy(() => import('./components/NetworkBackground'));

function StaticAtmosphericBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 right-0 w-full md:w-[80%] h-[100vh] overflow-hidden pointer-events-none z-0"
      style={{
        maskImage: 'radial-gradient(ellipse at 100% 40%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 100% 40%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(65% 55% at 78% 36%, rgba(210, 210, 215, 0.22) 0%, rgba(95, 95, 102, 0.14) 38%, rgba(24, 24, 27, 0.08) 65%, transparent 100%), radial-gradient(45% 40% at 52% 24%, rgba(160, 160, 168, 0.14) 0%, transparent 72%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

function canRunHeavyWebGL(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.matchMedia('(max-width: 767px)').matches) return false;
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  return true;
}

function GlobalBackgrounds() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [shouldRenderWebGL, setShouldRenderWebGL] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setShouldRenderWebGL(false);
      return;
    }

    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallMq = window.matchMedia('(max-width: 767px)');
    const coarseMq = window.matchMedia('(pointer: coarse)');

    const syncEligibility = () => {
      if (!canRunHeavyWebGL()) {
        setShouldRenderWebGL(false);
      }
    };

    reducedMq.addEventListener?.('change', syncEligibility);
    smallMq.addEventListener?.('change', syncEligibility);
    coarseMq.addEventListener?.('change', syncEligibility);

    if (!canRunHeavyWebGL()) {
      setShouldRenderWebGL(false);
      return () => {
        reducedMq.removeEventListener?.('change', syncEligibility);
        smallMq.removeEventListener?.('change', syncEligibility);
        coarseMq.removeEventListener?.('change', syncEligibility);
      };
    }

    let cancelled = false;
    let idleHandle: number | null = null;
    const schedule = () => {
      if (cancelled || !canRunHeavyWebGL()) return;
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (typeof w.requestIdleCallback === 'function') {
        idleHandle = w.requestIdleCallback(
          () => {
            if (!cancelled && canRunHeavyWebGL()) setShouldRenderWebGL(true);
          },
          { timeout: 2500 },
        );
      } else {
        idleHandle = window.setTimeout(() => {
          if (!cancelled && canRunHeavyWebGL()) setShouldRenderWebGL(true);
        }, 1200);
      }
    };
    const primer = window.setTimeout(schedule, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(primer);
      reducedMq.removeEventListener?.('change', syncEligibility);
      smallMq.removeEventListener?.('change', syncEligibility);
      coarseMq.removeEventListener?.('change', syncEligibility);
      if (idleHandle !== null) {
        const w = window as Window & {
          cancelIdleCallback?: (id: number) => void;
        };
        if (typeof w.cancelIdleCallback === 'function') {
          try {
            w.cancelIdleCallback(idleHandle);
          } catch {
            window.clearTimeout(idleHandle);
          }
        } else {
          window.clearTimeout(idleHandle);
        }
      }
    };
  }, [isHome]);

  if (!isHome) return null;

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <StaticAtmosphericBackdrop />
      {shouldRenderWebGL && (
        <div className="absolute inset-0 animate-[fadeIn_0.5s_ease-out]">
          <Suspense fallback={null}>
            <AtmosphericBackground />
            <NetworkBackground />
          </Suspense>
        </div>
      )}
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full"
      >
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/essays" element={<Navigate to="/articles" replace />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/upstream" element={<Upstream />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </m.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [chatMounted, setChatMounted] = useState(false);

  useEffect(() => {
    const onOpenChat = () => setChatMounted(true);
    window.addEventListener('open-lab-chat', onOpenChat, { once: true });
    return () => window.removeEventListener('open-lab-chat', onOpenChat);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
      <div className="min-h-screen flex flex-col selection:bg-electric-lime selection:text-zinc-950 relative">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[90] focus:rounded-full focus:bg-electric-lime focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-semibold focus:uppercase focus:tracking-widest focus:text-zinc-950 focus:outline-none"
        >
          Skip to content
        </a>
        <GlobalBackgrounds />
        <Navbar />
        <FloatingCoffeeButton />
        <FloatingChatButton />
        <main id="main-content" tabIndex={-1} className="flex-grow relative z-10 focus:outline-none">
          <AnimatedRoutes />
        </main>
        <div className="relative z-10">
          <Footer />
        </div>
        {chatMounted && (
          <Suspense fallback={null}>
            <SiteChatWidget defaultOpen />
          </Suspense>
        )}
        <VirtualCoffeePopup />
        <CommandPalette />
        <ToastRegion className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col gap-2 w-[min(100vw-2rem,24rem)] pointer-events-none">
          {() => (
            <Toast className="pointer-events-auto liquid-glass rounded-2xl px-4 py-3 flex items-start justify-between gap-3 transition-[opacity,transform] duration-200 data-starting-style:opacity-0 data-starting-style:translate-y-2 data-ending-style:opacity-0 data-ending-style:translate-y-2">
              <div className="min-w-0">
                <ToastTitle className="font-mono text-[11px] uppercase tracking-wider text-electric-lime" />
                <ToastDescription className="text-xs text-zinc-300 mt-0.5 truncate" />
              </div>
            </Toast>
          )}
        </ToastRegion>
      </div>
      </LazyMotion>
      </MotionConfig>
    </Router>
  );
}
