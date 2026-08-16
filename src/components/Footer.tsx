import { Github, Linkedin, Twitter } from 'lucide-react';
import LabStrip from './LabStrip';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 mt-32">
      <LabStrip />

      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-zinc-900/80">
        <div className="flex items-center gap-4">
          <img
            src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_100/v1768512786/Screenshot_2026-01-198_v3bwry.png"
            alt="Aditya Gaurav Logo"
            className="size-10 object-contain grayscale opacity-80"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            width={40}
            height={40}
          />
          <span className="text-zinc-400 text-sm">© 2026 Aditya Gaurav. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://x.com/adityaaidev" target="_blank" rel="noopener noreferrer" className="p-2 -m-2 text-zinc-500 hover:text-electric-lime transition-colors duration-300">
            <Twitter size={20} strokeWidth={1.5} />
            <span className="sr-only">X (Twitter)</span>
          </a>
          <a href="https://www.linkedin.com/in/adityaai/" target="_blank" rel="noopener noreferrer" className="p-2 -m-2 text-zinc-500 hover:text-electric-lime transition-colors duration-300">
            <Linkedin size={20} strokeWidth={1.5} />
            <span className="sr-only">LinkedIn</span>
          </a>
          <a href="https://github.com/adi-IL" target="_blank" rel="noopener noreferrer" className="p-2 -m-2 text-zinc-500 hover:text-electric-lime transition-colors duration-300">
            <Github size={20} strokeWidth={1.5} />
            <span className="sr-only">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
