/**
 * Post-build prerender script for adityaai.dev.
 * Reads Vite's built dist/index.html, extracts the production bundle tags,
 * and generates per-route HTML files with correct SEO meta tags for Googlebot.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");

// ── Read Vite build output ─────────────────────────────────────────────────

const viteHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");

const bodyMatch = viteHtml.match(/<body>([\s\S]*)<\/body>/i);
if (!bodyMatch) {
  console.error("❌ Could not parse Vite's dist/index.html body");
  process.exit(1);
}
const bodyContent = bodyMatch[1].trim();

const viteHeadMatch = viteHtml.match(/<head>([\s\S]*)<\/head>/i);
let viteAssetsHead = "";
if (viteHeadMatch) {
  const headContent = viteHeadMatch[1];
  const keep = [];
  for (const m of headContent.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/gi)) keep.push(m[0]);
  for (const m of headContent.matchAll(/<link[^>]*rel="modulepreload"[^>]*>/gi)) keep.push(m[0]);
  for (const m of headContent.matchAll(/<link[^>]*rel="preload"[^>]*>/gi)) {
    if (m[0].includes('as="style"') || m[0].includes('as="script"')) keep.push(m[0]);
  }
  for (const m of headContent.matchAll(/<script[^>]*type="module"[^>]*src="[^"]*"[^>]*><\/script>/gi)) keep.push(m[0]);
  for (const m of headContent.matchAll(/<link[^>]*rel="preconnect"[^>]*>/gi)) keep.push(m[0]);
  viteAssetsHead = keep.join("\n    ");
}

const SITE_URL = "https://www.adityaai.dev";
const OG_IMAGE = "https://res.cloudinary.com/df95kzdir/image/upload/v1768829921/Frame_11_2_i0mo2o.png";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Prefer build-generated meta (ISO dates, excerpts, categories).
const metaPath = path.resolve(__dirname, "articles-meta.json");
/** @type {{ slug: string, title: string, excerpt: string, dateISO: string }[]} */
let articles;
if (fs.existsSync(metaPath)) {
  articles = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
} else {
  console.warn("⚠️ articles-meta.json missing — run generate-articles-meta first");
  articles = [];
}

const projects = [
  { slug: "friday", name: "FRIDAY", tagline: "Immersive Engineering Visual Intelligence" },
  { slug: "sentinel", name: "Sentinel", tagline: "Autonomous Competitive Intelligence" },
  { slug: "opalserve", name: "OpalServe", tagline: "The control plane for your team's AI tools" },
];

function headTags(title, description, canonical, ogType, jsonLd) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  const safeOgType = escapeHtml(ogType);
  return `    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <meta name="color-scheme" content="dark" />
    <meta name="msapplication-TileColor" content="#09090b" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <link rel="canonical" href="${safeCanonical}" />
    <link rel="alternate" hreflang="en" href="${safeCanonical}" />
    <link rel="alternate" hreflang="x-default" href="${safeCanonical}" />
    <link rel="icon" type="image/png" href="https://res.cloudinary.com/df95kzdir/image/upload/v1768829921/Frame_11_2_i0mo2o.png" />
    <link rel="apple-touch-icon" href="https://res.cloudinary.com/df95kzdir/image/upload/v1768829921/Frame_11_2_i0mo2o.png" />
    <link rel="dns-prefetch" href="https://res.cloudinary.com" />
    <link rel="preconnect" href="https://res.cloudinary.com" crossorigin />
    <meta property="og:type" content="${safeOgType}" />
    <meta property="og:url" content="${safeCanonical}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="adityaai.dev" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${safeCanonical}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <meta name="twitter:creator" content="@adityaaidev" />
    <meta name="twitter:site" content="@adityaaidev" />
${jsonLd ? `    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
${viteAssetsHead}`;
}

function writePage(routeDir, title, description, canonical, ogType, jsonLd) {
  const dir = path.join(DIST, routeDir);
  fs.mkdirSync(dir, { recursive: true });
  const html = `<!doctype html>
<html lang="en">
  <head>
${headTags(title, description, canonical, ogType || "website", jsonLd)}
  </head>
  <body>
${bodyContent}
  </body>
</html>`;
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

console.log("🚀 Prerendering static pages for adityaai.dev...");
let count = 0;
const articleCount = articles.length;
const articleCountLabel = `${articleCount} research articles`;
const buildDate = new Date().toISOString().slice(0, 10);

// Homepage — no fake SearchAction (site has no search endpoint).
writePage(".", "Aditya Gaurav  -  AI Engineer · Systems Architect",
  `AI Engineer & Systems Architect specializing in agentic systems, cognitive architectures, and MCP. ${articleCountLabel} on building production-ready AI systems.`,
  `${SITE_URL}/`, "website", {
    "@context": "https://schema.org", "@type": "WebSite",
    name: "adityaai.dev",
    headline: "Aditya Gaurav  -  AI Engineer · Systems Architect",
    description: "AI Engineer & Systems Architect. Building agentic systems, cognitive architectures, and the MCP ecosystem.",
    url: `${SITE_URL}/`, inLanguage: "en",
    author: { "@type": "Person", name: "Aditya Gaurav", url: `${SITE_URL}/`, jobTitle: "AI Researcher & Systems Architect",
      sameAs: ["https://x.com/adityaaidev", "https://www.linkedin.com/in/adityaai/", "https://github.com/adityaidev"] },
  });
count++;

writePage("about", "About | Aditya Gaurav  -  AI Engineer & Systems Architect",
  `AI Engineer & Systems Architect building cognitive architectures, agentic workflows, and the MCP ecosystem. Kaggle winner, Oracle certified, ${articleCount} articles.`,
  `${SITE_URL}/about`, "profile", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` }],
  });
count++;

writePage("articles", "Articles | Aditya Gaurav  -  Research on AI Architecture & Systems Design",
  `Infrequent, high-signal research articles on AI architecture, agentic systems, cognitive architectures, MCP, and inference economics. ${articleCount} technical deep dives.`,
  `${SITE_URL}/articles`, "website", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` }],
  });
count++;

writePage("projects", "Projects | Aditya Gaurav  -  AI Systems & Open Source",
  "Production AI systems and open-source projects by Aditya Gaurav  -  FRIDAY (3D engineering visual intelligence), Sentinel (competitive intelligence), OpalServe (MCP registry).",
  `${SITE_URL}/projects`, "website", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE_URL}/projects` }],
  });
count++;

for (const a of articles) {
  const canonical = `${SITE_URL}/articles/${a.slug}`;
  const description =
    a.excerpt || "Research article by Aditya Gaurav on AI architecture and systems design.";
  writePage(`articles/${a.slug}`, `${a.title} | Aditya Gaurav`, description, canonical, "article", {
    "@context": "https://schema.org",
    "@type": a.form === "Principle" ? "Article" : "ScholarlyArticle",
    headline: a.title,
    description,
    url: canonical,
    image: OG_IMAGE,
    author: { "@type": "Person", name: "Aditya Gaurav", url: `${SITE_URL}/` },
    publisher: { "@type": "Person", name: "Aditya Gaurav", url: `${SITE_URL}/` },
    datePublished: a.dateISO,
    dateModified: a.dateISO,
    ...(typeof a.wordCount === "number" ? { wordCount: a.wordCount } : {}),
    ...(typeof a.readingTime === "number" ? { timeRequired: `PT${a.readingTime}M` } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  });
  count++;
}

for (const p of projects) {
  const canonical = `${SITE_URL}/projects/${p.slug}`;
  writePage(`projects/${p.slug}`, `${p.name}: ${p.tagline} | Aditya Gaurav`, p.tagline, canonical, "website", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE_URL}/projects` },
      { "@type": "ListItem", position: 3, name: p.name, item: canonical }],
  });
  count++;
}

console.log(`✅ Prerendered ${count} static HTML pages`);

// ── Sitemap (clean lastmod, fresher priority for recent essays) ─────────────

const newestDate = articles[0]?.dateISO || buildDate;
const recentCutoff = (() => {
  const d = new Date(`${newestDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 45);
  return d.toISOString().slice(0, 10);
})();

/** @type {{ loc: string, cf: string, pr: string, lm: string }[]} */
const entries = [
  { loc: `${SITE_URL}/`, cf: "weekly", pr: "1.0", lm: buildDate },
  { loc: `${SITE_URL}/about`, cf: "monthly", pr: "0.8", lm: buildDate },
  { loc: `${SITE_URL}/articles`, cf: "weekly", pr: "0.9", lm: newestDate },
  { loc: `${SITE_URL}/projects`, cf: "monthly", pr: "0.9", lm: buildDate },
];
for (const p of projects) {
  entries.push({ loc: `${SITE_URL}/projects/${p.slug}`, cf: "monthly", pr: "0.8", lm: buildDate });
}
for (const a of articles) {
  const isRecent = a.dateISO >= recentCutoff;
  entries.push({
    loc: `${SITE_URL}/articles/${a.slug}`,
    cf: isRecent ? "weekly" : "monthly",
    pr: isRecent ? "0.85" : "0.7",
    lm: a.dateISO,
  });
}

function urlEntry(e) {
  return `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lm}</lastmod>
    <changefreq>${e.cf}</changefreq>
    <priority>${e.pr}</priority>
  </url>`;
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlEntry).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf-8");
console.log(`✅ Generated sitemap.xml (${entries.length} URLs)`);

// ── llms.txt (kept in sync with live article inventory) ─────────────────────

const recentForLlms = articles.slice(0, Math.min(8, articles.length));
const llms = `# adityaai.dev

Personal lab site for Aditya Gaurav — AI Engineer & Systems Architect.
Focus: decision tools for people who design production AI systems
(agents, memory, inference economics, MCP, architecture).

## Person
- Name: Aditya Gaurav
- Role: AI Engineer & Systems Architect
- Location: Sonipat, Haryana, India
- Site: ${SITE_URL}
- GitHub: https://github.com/adityaidev
- LinkedIn: https://www.linkedin.com/in/adityaai/
- X: https://x.com/adityaaidev

## Pages
- Home: ${SITE_URL}/
- About: ${SITE_URL}/about
- Essays: ${SITE_URL}/articles (${articleCount} curated; not a high-volume blog)
- Projects: ${SITE_URL}/projects

## Lab products
- FRIDAY — https://friday.adityaai.dev — generative 3D engineering visualization
- Sentinel — https://sentinel.adityaai.dev — multi-agent competitive intelligence
- OpalServe — https://opalserve.adityaai.dev — MCP registry & team gateway
- Ohh-my-excel — https://github.com/adityaidev/Ohh-my-excel
- mt5-quant-windows — https://github.com/adityaidev/mt5-quant-windows

## Essays (shelf)
Forms: Framework | Architecture | Principle. Prefer permanent decision tools over news.
${recentForLlms
  .map((a) => {
    const month = new Date(`${a.dateISO}T12:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    const form = a.form || a.category || "Essay";
    return `- [${form}] "${a.title}" (${month})\n  ${SITE_URL}/articles/${a.slug}`;
  })
  .join("\n")}

## Stack
React 19, TypeScript, Vite, Tailwind, Vercel, Resend, Gemini, MCP, Three.js
`;

fs.writeFileSync(path.join(DIST, "llms.txt"), llms, "utf-8");
// Keep public/ in sync so local preview and git stay honest.
fs.writeFileSync(path.resolve(__dirname, "..", "public", "llms.txt"), llms, "utf-8");
console.log(`✅ Generated llms.txt (${recentForLlms.length} recent + archive link)`);
console.log(`✨ Done! Total: ${count} pages, ${entries.length} sitemap URLs, ${articleCount} articles`);
