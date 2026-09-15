import { useEffect, useRef, useState } from 'react';

/** Lab instrument: Canvas2D GPU-evoking field. No vgpu npm dep. Vercel Labs attribution. */
export default function VgpuInstrument() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cssW = 0;
    let cssH = 0;
    const t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth || 208;
      cssH = canvas.clientHeight || 96;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = reducedMotion ? 0 : (now - t0) / 1000;
      const w = cssW;
      const h = cssH;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      const gx = w * (0.35 + 0.15 * Math.sin(t * 0.4));
      const gy = h * (0.45 + 0.1 * Math.cos(t * 0.35));
      const grad = ctx.createRadialGradient(gx, gy, 4, gx, gy, Math.max(w, h) * 0.7);
      grad.addColorStop(0, 'rgba(204, 255, 0, 0.16)');
      grad.addColorStop(0.45, 'rgba(204, 255, 0, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const cell = 8;
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.55)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= w; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
      }

      for (let y = 0; y < h; y += cell) {
        for (let x = 0; x < w; x += cell) {
          const n =
            Math.sin(x * 0.07 + t * 1.4) *
            Math.cos(y * 0.09 - t * 1.1) *
            Math.sin((x + y) * 0.02 + t * 0.8);
          const v = (n + 1) * 0.5;
          if (v > 0.62) {
            const a = (v - 0.62) * 1.8;
            ctx.fillStyle = 'rgba(204, 255, 0, ' + Math.min(0.55, a * 0.55) + ')';
            ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          } else if (v > 0.48) {
            ctx.fillStyle = 'rgba(113, 113, 122, ' + (0.12 + (v - 0.48) * 0.4) + ')';
            ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          }
        }
      }

      if (!reducedMotion) {
        const scanY = ((t * 28) % (h + 20)) - 10;
        ctx.fillStyle = 'rgba(204, 255, 0, 0.08)';
        ctx.fillRect(0, scanY, w, 2);
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    if (reducedMotion) draw(performance.now());
    else raf = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(performance.now());
    });
    ro.observe(canvas);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reducedMotion]);

  return (
    <aside
      className="w-48 md:w-52 shrink-0 rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden shadow-lg"
      aria-label="vgpu lab instrument"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 bg-[#111]">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">vgpu</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">lab</span>
      </div>
      <div className="relative h-24 border-b border-zinc-800/60">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
      </div>
      <div className="p-3 space-y-3">
        <p className="text-[11px] leading-relaxed text-zinc-400 font-light">
          Vercel Labs&apos; tiny TypeScript WebGPU API for browser, node, and mock.
        </p>
        <div className="flex flex-wrap gap-1.5" aria-label="Runtime targets">
          {(['browser', 'node', 'mock'] as const).map((chip) => (
            <span key={chip} className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-800 rounded-full px-2 py-0.5">
              {chip}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest">
          <a href="https://github.com/vercel-labs/vgpu" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-electric-lime focus-visible:outline focus-visible:outline-1 focus-visible:outline-electric-lime focus-visible:outline-offset-2 rounded-sm transition-colors">GitHub</a>
          <span className="text-zinc-700" aria-hidden>·</span>
          <a href="https://vgpu.sh" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-electric-lime focus-visible:outline focus-visible:outline-1 focus-visible:outline-electric-lime focus-visible:outline-offset-2 rounded-sm transition-colors">vgpu.sh</a>
        </div>
      </div>
    </aside>
  );
}
