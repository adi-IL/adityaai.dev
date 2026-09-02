export type ProjectCategory = 'Product' | 'Platform' | 'CLI';
export type ProjectStatus = 'Live' | 'Beta' | 'Alpha' | 'Sunset';

export interface ProjectMetric {
  label: string;
  value: string;
}

export interface ProjectAward {
  label: string;
  sublabel?: string;
  url: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  excerpt: string;
  category: ProjectCategory;
  status: ProjectStatus;
  year: string;
  stack: string[];
  liveUrl: string;
  codeUrl: string;
  ogImage: string;
  accent: string; // tailwind text color for the wordmark highlight
  metrics: ProjectMetric[];
  content: string; // markdown
  award?: ProjectAward;
}

const friday: Project = {
  slug: 'friday',
  name: 'FRIDAY',
  tagline: 'Immersive Engineering Visual Intelligence',
  excerpt:
    'Generative 3D engineering visualization engine. Turn voice commands, sketches, or prompts into interactive mechanical assemblies in real time.',
  category: 'Product',
  status: 'Live',
  year: '2026',
  stack: ['React 19', 'Three.js', 'Gemini 3.1 Pro', 'Gemini Live', 'Vercel'],
  liveUrl: 'https://friday.adityaai.dev',
  codeUrl: 'https://github.com/adi-IL/friday-visual-engine',
  ogImage: 'https://friday.adityaai.dev/og-image.png',
  accent: 'text-cyan-300',
  award: {
    label: 'Google DeepMind × Kaggle Winner',
    sublabel: 'Gemini 3 Pro Hackathon · Developer Tools',
    url: 'https://www.kaggle.com/competitions/gemini-3/writeups/new-writeup-1765520565551',
  },
  metrics: [
    { label: 'DeepMind × Kaggle', value: 'Winner' },
    { label: 'Components per scene', value: '20-30' },
    { label: 'Generation time', value: '45-60s' },
  ],
  content: `## Overview

FRIDAY is a generative immersive visualization engine for engineering teams. Type a system name, upload a sketch, or speak a command, and a detailed 3D assembly compiles in front of you, ready to rotate, explode, scan, and interrogate.

It is not a chat app. It is a **neural spatial architect** that writes geometry the way language models write prose.

## The problem it solves

Engineering teams lose days between "we need a visual of X" and actually having one. CAD is heavyweight. Drawing tools are slow. AI image generators produce inspiration, not assemblies you can rotate. FRIDAY collapses that cycle to about a minute and produces something you can actually interact with.

## How it works

1. **Input layer** captures a voice command, a text prompt, or an uploaded image.
2. **Generation layer** runs a two-phase Gemini pipeline. Phase 1 (Pro) reasons about the whole object, picks real-world proportions, and outputs a scaffold of 24 to 28 components with exact coordinates. Phase 2 (Flash-lite, two parallel halves) fills in the primitive structure for each component so nothing clusters at origin.
3. **Rendering layer** materializes the scene in React Three Fiber. Holographic translucent walls, cyan silhouette edges, automatic camera framing, scan planes, and a shader pass that reveals interior components through outer shells.
4. **Interaction layer** exposes voice (Gemini Live native audio), hand gestures (MediaPipe), keyboard shortcuts, and click-to-inspect.

## What it ships with

- **Generative system builder** with a 20-30 component target and schema-validated output
- **Holographic CAD rendering** with bright cyan edges, transparent surfaces, and see-through cabinet walls
- **Voice-native workflow** using Gemini Live with ephemeral token generation via your own API key
- **Deep scan diagnostics** that surface stress points per component
- **Gesture layer** for explode, rotate, and zoom with hand tracking
- **BYOK security** - your API key stays in your browser, never on a server

## Technical architecture

- All Gemini calls route through Vercel Node functions as a BYOK proxy. No server-side key required.
- AudioWorklet pipeline downsamples mic input to 16 kHz Int16 PCM in a dedicated audio thread before handing frames to the Live API.
- The 3D scene auto-fits with drei's \`Bounds\` and gracefully downgrades quality tier on low-FPS devices via \`PerformanceMonitor\`.
- Per-IP rate limiting via in-memory tracker. Saved systems are stored in browser localStorage with a shareable hash URL.

## Engineering problems solved along the way

- Vercel Edge Functions have a 25 second ceiling. Switched \`/api/analyze\` to Node runtime with \`maxDuration: 60\` and an ESM import fix for the runtime.
- The Gemini Live WebSocket started dropping on frame 1 with close code 1007. Root cause: the \`realtime_input.media\` field was deprecated. Switched to \`audio\` and the session stayed alive.
- Single-shot Pro for 30 component generations kept timing out. Split into a skeleton phase and parallel structure phase, both aware of the full skeleton context so primitives stay spatially coherent.

## Why it matters

Most AI tools for engineering stop at generating an image. FRIDAY generates an **assembly**, with component names, connections, and positions you can manipulate. It is the closest I have shipped to a browser-native spatial language model.

## Recognition & awards

- **Winner: Google DeepMind × Kaggle Vibe Code with Gemini 3 Pro Hackathon (Developer Tools)**  
  Selected as one of 50 winning projects worldwide. Built for generative 3D CAD visualization, voice-driven spatial assembly, and two-phase geometric reasoning.
  - [Winning Kaggle Writeup](https://www.kaggle.com/competitions/gemini-3/writeups/new-writeup-1765520565551)
  - [Google DeepMind Hackathon Winners](https://www.kaggle.com/competitions/gemini-3/hackathon-winners)

## Links

- Live demo: [friday.adityaai.dev](https://friday.adityaai.dev)
- Kaggle writeup: [kaggle.com/competitions/gemini-3/writeups/new-writeup-1765520565551](https://www.kaggle.com/competitions/gemini-3/writeups/new-writeup-1765520565551)
- Source: [github.com/adi-IL/friday-visual-engine](https://github.com/adi-IL/friday-visual-engine)`,
};

const sentinel: Project = {
  slug: 'sentinel',
  name: 'Sentinel',
  tagline: 'Autonomous Competitive Intelligence',
  excerpt:
    'Five Gemini agents chained in a state machine. Hunts the web, performs scored SWOT, compiles a C-level strategic brief in under a minute.',
  category: 'Platform',
  status: 'Live',
  year: '2026',
  stack: ['React 19', 'Gemini Pro Latest', 'Gemini Flash Latest', 'Google Search', 'Supabase', 'Vercel'],
  liveUrl: 'https://sentinel.adityaai.dev',
  codeUrl: 'https://github.com/adi-IL/sentinel',
  ogImage: 'https://sentinel.adityaai.dev/og-image.png',
  accent: 'text-blue-400',
  metrics: [
    { label: 'Agents in the chain', value: '5 + Chat' },
    { label: 'Scored dimensions', value: '5' },
    { label: 'Runtime per analysis', value: '~45s' },
  ],
  content: `## Overview

Sentinel is an autonomous competitive intelligence platform that replaces hours of manual research with a single URL. Type a competitor's name. Walk away. Come back to a scored SWOT, a radar-chart fingerprint, and an executive markdown report.

The unfair advantage is that **every subjective strategic dimension becomes a number**. Instead of "their pricing is strong," you get \`pricing_power: 78\`.

## The pain it targets

- Senior analysts losing 20 hours a week to competitive research
- Pricing intel that is always 2 weeks stale
- SWOT decks nobody opens
- Research cycles measured in business days
- Scaling to 10+ rivals without proportional headcount

## The 5-agent chain

Each agent is a Vercel Node function. The chain is explicit state-machine code in the client, so a user can watch each step light up in real time.

1. **Router** (Flash). Classifies intent, extracts the target company, drafts three high-signal search queries.
2. **Hunter** (Flash with Google Search grounding). Pulls authoritative sources in real time - official pricing pages, changelogs, press releases. Returns structured \`{url, title, snippet}\` rows.
3. **Scraper** (Flash). Consolidates noise into a dense fact sheet under 4k tokens. Strips marketing fluff, preserves facts, numbers, dates.
4. **Analyst** (Pro). Runs a 360 SWOT. Crucially, it scores five strategic dimensions on a 0 to 100 integer scale:
   - Innovation (how cutting edge is their tech)
   - Market Share (relative strength or dominance)
   - Pricing Power (do they command a premium)
   - Brand Reputation (public sentiment)
   - Velocity (speed of shipping)
5. **Reporter** (Flash). Compiles a C-level markdown brief with Executive Summary, Market Updates table, and a single bold Strategic Recommendation.

An optional **Social** agent drafts a viral LinkedIn post from the report. A **Chat** agent provides context-aware follow-ups with live Google Search grounding on every turn.

## Battle Mode

The killer feature. Pick any two saved reports. Sentinel overlays the two radar charts, runs a direct metric-vs-metric "Tale of the Tape", and declares an advantage leader based on the data. No more subjective debates in strategy meetings.

## Why the scoring matters

Most CI tools stop at a qualitative SWOT. That gives you bullet points but no way to compare companies over time. Scoring every analysis on the same five axes means:

- You can graph a competitor's trajectory across quarterly runs
- You can compare two competitors on a single axis without reading both reports
- You can alert on threshold crossings (for example, "ping me when any competitor's pricing power drops below 60")

## Technical architecture

- **Server-side Gemini proxy** on Vercel Node Functions. The API key never ships to the browser.
- **Supabase Postgres** with row-level security on every table. Reports are persisted with a short share hash, so any analysis is one link away.
- **Per-IP rate limiting** via a Supabase RPC: 20 analyses per hour, 200 chat turns per hour, 30 per-agent per hour.
- **Pricing math fixed**. The original prototype divided by 1,000 for cost calculation when Gemini prices are per-million-tokens. Token costs were being under-reported by three orders of magnitude.
- **Strict TypeScript**, ESLint, Prettier, Vitest, and a GitHub Actions CI workflow.

## Shipping notes

- Zero Gemini key leakage verified with a production bundle scan
- \`/api/health\` endpoint confirms the model stack in real time
- Every report has a shareable \`/?r=<hash>\` URL with automatic OG preview

## Links

- Live demo: [sentinel.adityaai.dev](https://sentinel.adityaai.dev)
- Source: [github.com/adi-IL/sentinel](https://github.com/adi-IL/sentinel)`,
};

const midsphere: Project = {
  slug: 'midsphere',
  name: 'MidSphere',
  tagline: 'Autonomous Context Circuit-Breaker for Data Platforms',
  excerpt:
    'Closed-loop autonomous circuit-breaker engine for enterprise catalogs. Audits schema drift and PII leaks, scores selective blast radius, and applies advisory quarantine to protect downstream AI agents.',
  category: 'Platform',
  status: 'Live',
  year: '2026',
  stack: ['Python', 'FastAPI', 'Google Antigravity SDK', 'Gemini', 'DataHub MCP', 'Cloud Run', 'React Flow'],
  liveUrl: 'https://midsphere.vercel.app',
  codeUrl: 'https://github.com/adi-IL/MidSphere',
  ogImage: 'https://midsphere.vercel.app/og-image.png',
  accent: 'text-emerald-400',
  metrics: [
    { label: 'Closed-loop stages', value: '5' },
    { label: 'Decision latency', value: '<4s' },
    { label: 'Upstream contribution', value: 'Skills #88' },
  ],
  content: `## Overview

MidSphere is an autonomous context circuit-breaker engine for enterprise data platforms. Built for the DataHub ecosystem using Google Antigravity SDK and Gemini on Vertex AI, it protects downstream AI agents from consuming corrupted, drifted, or non-compliant catalog data.

Organizations deploy AI agents faster than they can maintain data catalog trust. When schema drift, quality defects, unmasked PII, or freshness violations hit a table, standard data catalogs only record an alert. Downstream AI agents continue reading the catalog and inherit the damage.

MidSphere replaces passive alerting with a **closed-loop circuit-breaker**: it audits context, calculates selective topological blast radius, applies advisory quarantine to DataHub graph state, generates dry-run remediation artifacts, and produces an MBOM (Model Bill of Materials) attestation.

## The 5-stage closed loop

MidSphere organizes autonomous intelligence into five specialized stages orchestrated via Google Antigravity SDK:

1. **Audit (\`ContextSentinel\`):** Detects schema drift, unmasked PII, and freshness violations across tables using the official DataHub MCP server.
2. **Topology (\`CascadeAnalyzer\`):** Traverses upstream and downstream lineage graphs, scoring selective blast radius and risk (0-100).
3. **Break (\`CircuitBreaker\`):** Writes advisory quarantine tags and structured properties to DataHub graph state. Crucially, it isolates impacted tables while keeping parallel unimpacted lineage branches open.
4. **Fix (\`FixArchitect\`):** Synthesizes verifiable dry-run SQL and dbt remediation patches.
5. **Inherit (\`MBOMEngine\`):** Generates an MBOM attestation and saves document records to DataHub so downstream humans and agents inherit verified data provenance.

## Consumer gate

MidSphere exposes a high-speed Consumer Gate endpoint (\`GET /v1/gate/{urn}\`). When a client coding or data agent attempts to query a catalog resource, the gate checks active quarantine status:

- **Unimpacted datasets:** Returns \`ALLOWED\` with lineage provenance.
- **Quarantined datasets:** Returns \`BLOCKED\` with the active violation reason and blast radius score, preventing prompt injection or hallucination cascades before the agent executes.

## Technical architecture

- **Backend:** FastAPI, Pydantic, and Uvicorn running on Google Cloud Run with Vertex AI integration.
- **Agent Workforce:** Google Antigravity SDK (\`google-antigravity\`) coordinating multi-stage tools on Gemini with deterministic pipeline fallback.
- **Catalog Integration:** Official DataHub MCP server (\`mcp-server-datahub\`) executing real catalog operations (\`search\`, \`get_lineage\`, \`list_schema_fields\`, \`add_tags\`, \`remove_tags\`, \`save_document\`).
- **Command Center:** React 18, Vite, TypeScript, Tailwind, and React Flow deployed on Vercel with real-time interactive graph topology and state scrubbers.
- **Upstream Contribution:** Contributed official skills to DataHub: [datahub-project/datahub-skills#88](https://github.com/datahub-project/datahub-skills/pull/88) (\`datahub-circuit-breaker\`, \`datahub-quality-circuit\`).

## Why build this

Scanners and gateways inspect tool calls at the proxy level and block requests. But they have zero awareness of data quality, schema drift, or column-level PII inside the catalog itself.

MidSphere starts where API gateways stop. By embedding circuit-breaker patterns directly into catalog graph state, it ensures that downstream autonomous agents never inherit toxic context.

## Links

- Command Center: [midsphere.vercel.app](https://midsphere.vercel.app)
- Source: [github.com/adi-IL/MidSphere](https://github.com/adi-IL/MidSphere)
- Upstream PR: [datahub-project/datahub-skills#88](https://github.com/datahub-project/datahub-skills/pull/88)`,
};

export const projects: Project[] = [friday, sentinel, midsphere];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
