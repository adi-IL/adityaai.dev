import { m } from 'motion/react';

/**
 * Per-project signature visual. Replaces the flat `background-image: url(ogImage)`
 * treatment on project cards so the three projects stop looking interchangeable.
 *
 * - FRIDAY  -> cyan isometric wireframe cube (3D product)
 * - Sentinel-> blue concentric radar + 5 dots (5-agent chain)
 * - MidSphere-> emerald circuit breaker graph (context circuit breaker)
 */
export default function ProjectSignature({ slug }: { slug: string }) {
  switch (slug) {
    case 'friday':
      return <FridaySignature />;
    case 'sentinel':
      return <SentinelSignature />;
    case 'midsphere':
      return <MidSphereSignature />;
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

function MidSphereSignature() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.14)_0%,_transparent_60%)]">
      <svg
        viewBox="0 0 240 140"
        className="w-full max-w-[280px] text-emerald-400 font-mono"
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        {/* Connection lines */}
        <path d="M 40 70 L 105 42" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.5" />
        <path d="M 40 70 L 105 98" strokeWidth="1.25" opacity="0.6" />
        <path d="M 105 42 L 180 42" strokeWidth="1.25" stroke="#ef4444" opacity="0.8" />
        <path d="M 105 98 L 180 98" strokeWidth="1.25" opacity="0.6" />

        {/* Root Source Node */}
        <circle cx="40" cy="70" r="16" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.5" />
        <text x="40" y="73" fontSize="8" fill="#CaFF4A" textAnchor="middle" stroke="none" fontWeight="600">RAW</text>

        {/* Impacted Fork (Audit) */}
        <circle cx="105" cy="42" r="13" fill="#0a0a0a" stroke="#ef4444" strokeWidth="1.5" />
        <text x="105" y="45" fontSize="7" fill="#f87171" textAnchor="middle" stroke="none">AUDIT</text>

        {/* Quarantined Mart Node */}
        <rect x="180" y="29" width="52" height="26" rx="5" fill="#0a0a0a" stroke="#ef4444" strokeWidth="1.5" />
        <text x="206" y="45" fontSize="7" fill="#f87171" textAnchor="middle" stroke="none" fontWeight="600">BLOCKED</text>

        {/* Open Fork */}
        <circle cx="105" cy="98" r="13" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.5" />
        <text x="105" y="101" fontSize="7" fill="#6ee7b7" textAnchor="middle" stroke="none">OPEN</text>

        {/* Safe Mart Node */}
        <rect x="180" y="85" width="52" height="26" rx="5" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.5" />
        <text x="206" y="101" fontSize="7" fill="#CaFF4A" textAnchor="middle" stroke="none" fontWeight="600">CLEAR</text>

        {/* Pulsing indicator */}
        <m.circle
          cx="180"
          cy="42"
          r="4"
          fill="#ef4444"
          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
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
