import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
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

const AtmosphericBackground = lazy(() => import('./components/AtmosphericBackground'));
const NetworkBackground = lazy(() => import('./components/NetworkBackground'));

function GlobalBackgrounds() {
  const location = useLocation();
  if (location.pathname !== '/') return null;

  return (
    <div className="absolute inset-0 overflow-hidden z-0 animate-[fadeIn_0.5s_ease-out]">
      <Suspense fallback={null}>
        <AtmosphericBackground />
        <NetworkBackground />
      </Suspense>
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
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/essays" element={<Navigate to="/articles" replace />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </m.div>
    </AnimatePresence>
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
          <AnimatedRoutes />
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
