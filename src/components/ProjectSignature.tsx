import { m } from 'motion/react';

/**
 * Per-project signature visual. Replaces the flat `background-image: url(ogImage)`
 * treatment on project cards so the three projects stop looking interchangeable.
 *
 * - FRIDAY  -> cyan isometric wireframe cube (3D product)
 * - Sentinel-> blue concentric radar + 5 dots (5-agent chain)
 * - OpalServe-> orange typed CLI line (CLI + control plane)
 */
export default function ProjectSignature({ slug }: { slug: string }) {
  switch (slug) {
    case 'friday':
      return <FridaySignature />;
    case 'sentinel':
      return <SentinelSignature />;
    case 'opalserve':
      return <OpalServeSignature />;
    default:
      return <DefaultSignature />;
  }
}

function FridaySignature() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.12)_0%,_transparent_60%)]">
      <svg
        viewBox="0 0 200 200"
        className="w-2/3 max-w-[260px] text-cyan-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        aria-hidden
      >
        <g opacity="0.25">
          <path d="M20 100 L100 60 L180 100 L100 140 Z" />
          <path d="M100 60 L100 140" />
          <path d="M20 100 L180 100" />
        </g>
        <m.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <path d="M60 80 L100 60 L140 80 L140 120 L100 140 L60 120 Z" />
          <path d="M60 80 L60 120" />
          <path d="M100 60 L100 100" />
          <path d="M140 80 L140 120" />
          <path d="M60 80 L100 100 L140 80" />
          <path d="M60 120 L100 100" />
          <path d="M100 100 L140 120" />
        </m.g>
        <circle cx="100" cy="100" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

function SentinelSignature() {
  const agents = ['R', 'H', 'S', 'A', 'W'];
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_rgba(96,165,250,0.12)_0%,_transparent_60%)]">
      <svg
        viewBox="0 0 200 200"
        className="w-2/3 max-w-[260px] text-blue-400"
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        {[30, 55, 80].map((r, i) => (
          <m.circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            strokeWidth="0.75"
            opacity={0.4 - i * 0.1}
            animate={{ r: [r, r + 2, r] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {agents.map((label, i) => {
          const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
          const x = 100 + Math.cos(angle) * 65;
          const y = 100 + Math.sin(angle) * 65;
          return (
            <g key={label}>
              <line
                x1="100"
                y1="100"
                x2={x}
                y2={y}
                strokeWidth="0.5"
                opacity="0.4"
              />
              <circle cx={x} cy={y} r="9" fill="currentColor" opacity="0.15" />
              <circle cx={x} cy={y} r="4" fill="currentColor" />
              <text
                x={x}
                y={y + 3}
                fontSize="7"
                fontFamily="ui-monospace,monospace"
                fill="#050505"
                textAnchor="middle"
                stroke="none"
              >
                {label}
              </text>
            </g>
          );
        })}
        <circle cx="100" cy="100" r="5" fill="currentColor" />
      </svg>
    </div>
  );
}

function OpalServeSignature() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_rgba(251,146,60,0.12)_0%,_transparent_60%)]">
      <div className="w-full max-w-[280px] rounded-lg border border-zinc-800/80 bg-zinc-950/80 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/60">
          <span className="size-2 rounded-full bg-zinc-700" />
          <span className="size-2 rounded-full bg-zinc-700" />
          <span className="size-2 rounded-full bg-zinc-700" />
          <span className="ml-auto font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
            opalserve · :3456
          </span>
        </div>
        <div className="px-3 py-4 font-mono text-[11px] leading-relaxed">
          <div className="text-zinc-500">$ opalserve server add \</div>
          <div className="text-zinc-300 pl-3">--name files --stdio <span className="text-orange-400">"npx @mcp/fs"</span></div>
          <m.div
            className="mt-2 flex items-center gap-2 text-orange-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>✓</span>
            <span className="text-zinc-300">registered &middot; synced to 3 devs</span>
          </m.div>
        </div>
      </div>
    </div>
  );
}

function DefaultSignature() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="font-mono text-xs uppercase tracking-widest text-zinc-600">adityaai.dev</div>
    </div>
  );
}
