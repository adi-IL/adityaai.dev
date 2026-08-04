/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';
import VirtualCoffeePopup from './components/VirtualCoffeePopup';
import FloatingCoffeeButton from './components/FloatingCoffeeButton';
import FloatingChatButton from './components/FloatingChatButton';
import SiteChatWidget from './components/SiteChatWidget';

// Lazy load heavy Three.js backgrounds
const AtmosphericBackground = lazy(() => import('./components/AtmosphericBackground'));
const NetworkBackground = lazy(() => import('./components/NetworkBackground'));

function GlobalBackgrounds() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setShouldRender(false);
      return;
    }

    let cancelled = false;
    let idleHandle: number | null = null;
    const schedule = () => {
      if (cancelled) return;
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (typeof w.requestIdleCallback === 'function') {
        idleHandle = w.requestIdleCallback(
          () => {
            if (!cancelled) setShouldRender(true);
          },
          { timeout: 2000 },
        );
      } else {
        idleHandle = window.setTimeout(() => {
          if (!cancelled) setShouldRender(true);
        }, 800);
      }
    };
    const primer = window.setTimeout(schedule, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(primer);
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

  if (!shouldRender) return null;

  return (
    <div className="absolute inset-0 overflow-hidden z-0 animate-[fadeIn_0.5s_ease-out]">
      <Suspense fallback={null}>
        <AtmosphericBackground />
        <NetworkBackground />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <LazyMotion features={domAnimation}>
      <div className="min-h-screen flex flex-col selection:bg-electric-lime selection:text-zinc-950 relative">
        <GlobalBackgrounds />
        <Navbar />
        <main className="flex-grow relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <div className="relative z-10">
          <Footer />
        </div>
        <FloatingChatButton />
        <SiteChatWidget />
        <FloatingCoffeeButton />
        <VirtualCoffeePopup />
      </div>
      </LazyMotion>
    </Router>
  );
}
