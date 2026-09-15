export default function VgpuInstrument() {
  return (
    <aside className="w-48 md:w-52 shrink-0 rounded-xl border border-zinc-800 bg-[#0a0a0a] p-3" aria-label="vgpu lab instrument">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">vgpu</div>
      <p className="text-[11px] text-zinc-400 font-light mt-2">
        Vercel Labs&apos; tiny TypeScript WebGPU API for browser, node, and mock.
      </p>
      <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Runtime targets">
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-800 rounded-full px-2 py-0.5">browser</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-800 rounded-full px-2 py-0.5">node</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-800 rounded-full px-2 py-0.5">mock</span>
      </div>
      <div className="flex items-center gap-3 mt-3 font-mono text-[10px] uppercase tracking-widest">
        <a href="https://github.com/vercel-labs/vgpu" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-electric-lime focus-visible:outline focus-visible:outline-1 focus-visible:outline-electric-lime focus-visible:outline-offset-2 rounded-sm transition-colors">GitHub</a>
        <span className="text-zinc-700" aria-hidden>·</span>
        <a href="https://vgpu.sh" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-electric-lime focus-visible:outline focus-visible:outline-1 focus-visible:outline-electric-lime focus-visible:outline-offset-2 rounded-sm transition-colors">vgpu.sh</a>
      </div>
    </aside>
  );
}
