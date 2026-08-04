import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-screen pt-40 pb-16 flex flex-col items-center justify-center text-center px-6">
      <SEO
        title="404 - Page Not Found | Aditya Gaurav"
        description="The page you're looking for doesn't exist or has been moved."
        noIndex
      />
      <h1 className="font-display font-semibold text-[clamp(4rem,12vw,8rem)] leading-none text-zinc-50 mb-4">404</h1>
      <p className="text-zinc-400 text-lg mb-8 max-w-md">
        This page doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="border border-zinc-800 rounded-full px-6 py-3 text-zinc-400 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors"
      >
        Back home
      </Link>
    </div>
  );
}
