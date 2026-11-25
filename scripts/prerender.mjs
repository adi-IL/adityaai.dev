/**
 * Post-build prerender script for adityaai.dev.
 * Reads Vite's built dist/index.html, extracts the production bundle tags,
 * and generates per-route HTML files with correct SEO meta tags for Googlebot.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const tsProjectsPath = path.resolve(__dirname, "..", "src", "lib", "projects.ts");
const tsProjectsSource = fs.readFileSync(tsProjectsPath, "utf-8");
const transformedProjects = esbuild.transformSync(tsProjectsSource, { loader: "ts", format: "esm" });
const projectsDataUrl = "data:text/javascript;base64," + Buffer.from(transformedProjects.code).toString("base64");
const { projects } = await import(projectsDataUrl);
const tsUpstreamSource = fs.readFileSync(path.resolve(__dirname, "..", "src", "lib", "upstream.ts"), "utf-8");
const transformedUpstream = esbuild.transformSync(tsUpstreamSource, { loader: "ts", format: "esm" });
const { upstreamReceipts } = await import(
  "data:text/javascript;base64," + Buffer.from(transformedUpstream.code).toString("base64")
);
const upstreamLedger = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "src", "data", "upstream-ledger.json"), "utf-8"),
);

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
  const headContent = viteHeadMatch[1].replace(/<noscript>[\s\S]*?<\/noscript>/gi, "");
  const noscriptLinks = [...viteHeadMatch[1].matchAll(/<noscript>[\s\S]*?<\/noscript>/gi)].map((m) => m[0]);
  const keep = [];
  for (const m of headContent.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/gi)) keep.push(m[0]);
  for (const m of headContent.matchAll(/<link[^>]*rel="modulepreload"[^>]*>/gi)) keep.push(m[0]);
  for (const m of headContent.matchAll(/<link[^>]*rel="preload"[^>]*>/gi)) {
    if (m[0].includes('as="style"') || m[0].includes('as="script"')) keep.push(m[0]);
  }
  for (const m of headContent.matchAll(/<script[^>]*type="module"[^>]*src="[^"]*"[^>]*><\/script>/gi)) keep.push(m[0]);
  for (const m of headContent.matchAll(/<link[^>]*rel="preconnect"[^>]*>/gi)) keep.push(m[0]);
  keep.push(...noscriptLinks);
  viteAssetsHead = keep.join("\n    ");
}

const SITE_URL = "https://www.adityaai.dev";
const SITE = SITE_URL;
const OG_IMAGE = "https://www.adityaai.dev/og-image.png";

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
  console.warn("⚠️ articles-meta.json missing - run generate-articles-meta first");
  articles = [];
}


function renderNav() {
  return `<nav aria-label="Main Navigation">
  <a href="/">Home</a> | <a href="/about">About</a> | <a href="/articles">Articles</a> | <a href="/projects">Projects</a> | <a href="/upstream">Upstream</a>
</nav>`;
}

function renderHomeBody(articlesList, projectsList) {
  const featured = articlesList.filter((a) => a.featured);
  const featuredList = featured.length > 0 ? featured : articlesList.slice(0, 4);

  const featuredItems = featuredList
    .map(
      (a) => `      <li>
        <article>
          <h3><a href="/articles/${escapeHtml(a.slug)}">${escapeHtml(a.title)}</a></h3>
          <p><time datetime="${escapeHtml(a.dateISO || a.date)}">${escapeHtml(a.date || a.dateISO)}</time> · <span>${escapeHtml(a.form || "Article")}</span></p>
          <p>${escapeHtml(a.excerpt || "")}</p>
        </article>
      </li>`
    )
    .join("\n");

  const projectItems = projectsList
    .map(
      (p) => `      <li>
        <article>
          <h3><a href="/projects/${escapeHtml(p.slug)}">${escapeHtml(p.name)}</a></h3>
          <p><strong>${escapeHtml(p.tagline)}</strong></p>
          <p>${escapeHtml(p.description || p.excerpt || "")}</p>
        </article>
      </li>`
    )
    .join("\n");

  return `<header>
  ${renderNav()}
  <h1>Aditya Gaurav</h1>
  <p>AI Researcher &amp; Systems Architect</p>
</header>
<main>
  <section aria-labelledby="bio-heading">
    <h2 id="bio-heading">About Aditya Gaurav</h2>
    <p>AI Researcher &amp; Systems Architect specializing in agentic systems, cognitive architectures, and MCP. Focused on building production-ready AI systems that reason, plan, and execute reliably.</p>
  </section>
  <section aria-labelledby="hero-heading">
    <h2 id="hero-heading">Systems &amp; Cognitive Architecture</h2>
    <p>Researching the layer between foundational models and enterprise infrastructure. Exploring dynamic agent state, context quarantine, multi-agent evaluation, and inference economics.</p>
  </section>
  <section aria-labelledby="featured-articles-heading">
    <h2 id="featured-articles-heading">Featured Research &amp; Articles</h2>
    <ul>
${featuredItems}
    </ul>
    <p><a href="/articles">View all research articles &rarr;</a></p>
  </section>
  <section aria-labelledby="featured-projects-heading">
    <h2 id="featured-projects-heading">Selected Projects</h2>
    <ul>
${projectItems}
    </ul>
    <p><a href="/projects">View all projects &rarr;</a></p>
  </section>
</main>
<footer>
  <p>&copy; ${new Date().getFullYear()} Aditya Gaurav. <a href="/">Home</a> · <a href="/about">About</a> · <a href="/articles">Articles</a> · <a href="/projects">Projects</a></p>
</footer>`;
}

function renderAboutBody() {
  return `<header>
  ${renderNav()}
  <h1>About Aditya Gaurav</h1>
  <p>AI Researcher &amp; Systems Architect</p>
</header>
<main>
  <section aria-labelledby="bio-heading">
    <h2 id="bio-heading">Bio &amp; Focus</h2>
    <p>I am an AI Researcher &amp; Systems Architect focused on cognitive architectures and scalable intelligence. My work bridges the gap between theoretical AI models and production-ready systems.</p>
    <p>With a deep focus on agentic workflows, large language models, and scalable inference, I build systems that don't just predict the next token, but actively plan, reason, and execute complex tasks.</p>
  </section>
  <section aria-labelledby="credentials-heading">
    <h2 id="credentials-heading">Honors &amp; Certifications</h2>
    <ul>
      <li><strong>Google DeepMind &times; Kaggle Winner:</strong> Vibe Code with Gemini 3 Pro Hackathon (Developer Tools track).</li>
      <li><strong>Oracle Certified:</strong> AI Vector Search Professional, Cloud Infrastructure Associate, Data Platform Associate, and Data Science Professional.</li>
      <li><strong>Cloud &amp; GenAI Certifications:</strong> Google Cloud Certified and OpenAI GenAI Certified.</li>
      <li><strong>Design &amp; UI/UX:</strong> Udemy UI UX Mastery Certified.</li>
    </ul>
  </section>
  <section aria-labelledby="explore-heading">
    <h2 id="explore-heading">Explore My Work</h2>
    <p>Read my deep dives on AI systems architecture, agentic evaluation, and inference economics in <a href="/articles">Articles</a>, or explore production AI engines in <a href="/projects">Projects</a>.</p>
  </section>
</main>
<footer>
  <p><a href="/">Back to Home</a> · <a href="/articles">Articles</a> · <a href="/projects">Projects</a></p>
</footer>`;
}

function renderArticlesListBody(articlesList) {
  const items = articlesList
    .map(
      (a) => `    <li>
      <article>
        <h2><a href="/articles/${escapeHtml(a.slug)}">${escapeHtml(a.title)}</a></h2>
        <p><time datetime="${escapeHtml(a.dateISO || a.date)}">${escapeHtml(a.date || a.dateISO)}</time> · <span>${escapeHtml(a.form || "Article")}</span></p>
        <p>${escapeHtml(a.excerpt || "")}</p>
        <p><a href="/articles/${escapeHtml(a.slug)}">Read full article &rarr;</a></p>
      </article>
    </li>`
    )
    .join("\n");

  return `<header>
  ${renderNav()}
  <h1>Research Articles &amp; Technical Deep Dives</h1>
  <p>Infrequent, high-signal research on AI architecture, agentic systems, cognitive architectures, and systems design by Aditya Gaurav.</p>
</header>
<main>
  <ul>
${items}
  </ul>
</main>
<footer>
  <p><a href="/">Back to Home</a> · <a href="/projects">Projects</a> · <a href="/about">About</a></p>
</footer>`;
}

function renderProjectsListBody(projectsList) {
  const items = projectsList
    .map(
      (p) => `    <li>
      <article>
        <h2><a href="/projects/${escapeHtml(p.slug)}">${escapeHtml(p.name)}</a></h2>
        <p><strong>${escapeHtml(p.tagline)}</strong></p>
        <p>${escapeHtml(p.excerpt || "")}</p>
        <p><a href="/projects/${escapeHtml(p.slug)}">View ${escapeHtml(p.name)} project brief &rarr;</a></p>
      </article>
    </li>`
    )
    .join("\n");
  return `<header>
  ${renderNav()}
  <h1>AI Systems &amp; Open Source Projects</h1>
  <p>Production AI systems and open-source architectures engineered by Aditya Gaurav.</p>
</header>
<main>
  <ul>
${items}
  </ul>
</main>
<footer>
  <p><a href="/">Back to Home</a> · <a href="/articles">Articles</a> · <a href="/about">About</a></p>
</footer>`;
}

function renderUpstreamBody(items) {
  const rows = items
    .map((p) => {
      const receipt = upstreamReceipts.find((r) => r.url === p.url);
      const account = receipt
        ? `
      <p>Issue: ${escapeHtml(receipt.issue)}</p>
      <p>Fix: ${escapeHtml(receipt.fix)}</p>`
        : "";
      return `    <li>
      <p><a href="${escapeHtml(p.url)}">${escapeHtml(p.repo)}#${p.number}</a>: ${escapeHtml(p.title)} (merged ${escapeHtml(p.mergedAt.slice(0, 10))}, +${p.additions} -${p.deletions})${
        p.test ? ` · <a href="${escapeHtml(p.test.url)}">regression test ${escapeHtml(p.test.label)}</a>` : ""
      }</p>${account}
    </li>`;
    })
    .join("\n");
  const tested = items.filter((p) => p.test).length;
  return `<header>
  ${renderNav()}
  <h1>Upstream ledger</h1>
  <p>${items.length} merged pull requests in open-source AI infrastructure. ${tested} of them ship a regression test.</p>
</header>
<main>
  <ul>
${rows}
  </ul>
</main>
<footer>
  <p><a href="/">Back to Home</a> · <a href="/projects">Projects</a> · <a href="/articles">Articles</a></p>
</footer>`;
}

function renderProjectDetailBody(project) {
  const renderedContent = project.content
    ? renderToStaticMarkup(
        React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, project.content)
      )
    : `<p>${escapeHtml(project.excerpt || "")}</p>`;

  const metricsList = Array.isArray(project.metrics) && project.metrics.length > 0
    ? `    <section aria-labelledby="project-metrics">
      <h2 id="project-metrics">Project Metrics</h2>
      <ul>
${project.metrics.map((m) => `        <li><strong>${escapeHtml(m.label)}:</strong> ${escapeHtml(m.value)}</li>`).join("\n")}
      </ul>
    </section>`
    : "";

  const stackLine = Array.isArray(project.stack) && project.stack.length > 0
    ? `<p><strong>Stack:</strong> ${escapeHtml(project.stack.join(" · "))}</p>`
    : "";

  const awardLine = project.award
    ? `<p><strong>Award:</strong> <a href="${escapeHtml(project.award.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.award.label)}${project.award.sublabel ? ` (${escapeHtml(project.award.sublabel)})` : ""}</a></p>`
    : "";

  const linksLine = `    <p>
      ${project.liveUrl ? `<a href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noopener noreferrer">Live Site &rarr;</a>` : ""}
      ${project.codeUrl ? ` | <a href="${escapeHtml(project.codeUrl)}" target="_blank" rel="noopener noreferrer">Source Code &rarr;</a>` : ""}
    </p>`;

  return `<header>
  ${renderNav()}
  <p><a href="/projects">&larr; Back to Projects</a> | <a href="/">Home</a></p>
  <h1>${escapeHtml(project.name)}</h1>
  <p><strong>${escapeHtml(project.tagline)}</strong></p>
  ${stackLine}
  ${awardLine}
  ${linksLine}
</header>
<main>
  <article>
    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading">Overview</h2>
      <p>${escapeHtml(project.excerpt || "")}</p>
    </section>
${metricsList}
    <section aria-labelledby="architecture-heading">
      <h2 id="architecture-heading">System Architecture &amp; Implementation</h2>
${renderedContent}
    </section>
  </article>
</main>
<footer>
  <p><a href="/projects">&larr; Return to Projects</a> | <a href="/articles">Browse Articles</a> | <a href="/about">About Aditya Gaurav</a></p>
</footer>`;
}

function renderArticleDetailBody(article) {
  const mdPath = path.resolve(__dirname, "..", "src", "content", "articles", `${article.slug}.md`);
  let renderedMarkdown = "";
  if (fs.existsSync(mdPath)) {
    const rawMarkdown = fs.readFileSync(mdPath, "utf-8");
    const cleanMarkdown = rawMarkdown
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
      .trimStart()
      .replace(/^#\s+[^\r\n]+\r?\n?/, "");
    renderedMarkdown = renderToStaticMarkup(
      React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, cleanMarkdown)
    );
  } else {
    renderedMarkdown = `<p>${escapeHtml(article.excerpt || "")}</p>`;
  }

  const title = escapeHtml(article.title);
  const dateStr = escapeHtml(article.date || article.dateISO || "");
  const dateISO = escapeHtml(article.dateISO || article.date || "");
  const form = escapeHtml(article.form || "Article");

  return `<header>
  ${renderNav()}
  <p><a href="/articles">&larr; Back to Articles</a> | <a href="/">Home</a></p>
  <h1>${title}</h1>
  <p>By <strong>Aditya Gaurav</strong> · <time datetime="${dateISO}">${dateStr}</time> · <span>${form}</span></p>
</header>
<main>
  <article>
${renderedMarkdown}
  </article>
</main>
<footer>
  <p><a href="/articles">&larr; Back to Articles</a> | <a href="/">Return to Home</a> | <a href="/projects">Projects</a></p>
</footer>`;
}


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

function writePage(routeDir, title, description, canonical, ogType, jsonLd, pageBody = "") {
  const dir = path.join(DIST, routeDir);
  fs.mkdirSync(dir, { recursive: true });
  const finalBodyContent = pageBody
    ? bodyContent.replace(
        '<div id="root"></div>',
        () => '<div id="root"></div>\n    <noscript>\n      <div id="prerendered-content">\n' + pageBody + '\n      </div>\n    </noscript>'
      )
    : bodyContent;
  const html = `<!doctype html>
<html lang="en">
  <head>
${headTags(title, description, canonical, ogType || "website", jsonLd)}
  </head>
  <body>
${finalBodyContent}
  </body>
</html>`;
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}


console.log("🚀 Prerendering static pages for adityaai.dev...");
let count = 0;
const articleCount = articles.length;
const articleCountLabel = `${articleCount} research articles`;
const buildDate = new Date().toISOString().slice(0, 10);

// Homepage - no fake SearchAction (site has no search endpoint).
writePage(".", "Aditya Gaurav - AI Researcher · Systems Architect",
  `AI Researcher & Systems Architect specializing in agentic systems, cognitive architectures, and MCP. ${articleCountLabel} on building production-ready AI systems.`,
  `${SITE_URL}/`, "website", {
    "@context": "https://schema.org", "@type": "WebSite",
    name: "adityaai.dev",
    headline: "Aditya Gaurav - AI Researcher · Systems Architect",
    description: "AI Researcher & Systems Architect. Building agentic systems, cognitive architectures, and the MCP ecosystem.",
    url: `${SITE_URL}/`, inLanguage: "en",
    author: { "@type": "Person", name: "Aditya Gaurav", url: `${SITE_URL}/`, jobTitle: "AI Researcher & Systems Architect",
      sameAs: ["https://x.com/adityaaidev", "https://www.linkedin.com/in/adityaai/", "https://github.com/adi-IL"] },
  }, renderHomeBody(articles, projects));
count++;

writePage("about", "About | Aditya Gaurav - AI Researcher & Systems Architect",
  `AI Researcher & Systems Architect building cognitive architectures, agentic workflows, and the MCP ecosystem. Kaggle winner, Oracle certified, ${articleCount} articles.`,
  `${SITE_URL}/about`, "profile", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` }],
  }, renderAboutBody());
count++;

writePage("articles", "Articles | Aditya Gaurav - Research on AI Architecture & Systems Design",
  `Infrequent, high-signal research articles on AI architecture, agentic systems, cognitive architectures, MCP, and inference economics. ${articleCount} technical deep dives.`,
  `${SITE_URL}/articles`, "website", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` }],
  }, renderArticlesListBody(articles));
count++;

writePage("projects", "Projects | Aditya Gaurav - AI Systems & Open Source",
  "Production AI systems and open-source projects by Aditya Gaurav - FRIDAY (3D engineering visual intelligence), Sentinel (competitive intelligence), MidSphere (autonomous context circuit-breaker).",
  `${SITE_URL}/projects`, "website", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE_URL}/projects` }],
  }, renderProjectsListBody(projects));
count++;

writePage("upstream", "Upstream | Aditya Gaurav - Merged open-source fixes",
  `${upstreamLedger.items.length} merged pull requests in TensorFlow, gVisor, Grafana and more, with the regression test behind each fix.`,
  `${SITE_URL}/upstream`, "website", {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Upstream", item: `${SITE_URL}/upstream` }],
  }, renderUpstreamBody(upstreamLedger.items));
count++;

for (const a of articles) {
  const canonical = `${SITE_URL}/articles/${a.slug}`;
  const description =
    a.seoDescription || a.excerpt || "Research article by Aditya Gaurav on AI architecture and systems design.";
  writePage(`articles/${a.slug}`, `${a.seoTitle || a.title} | Aditya Gaurav`, description, canonical, "article", {
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
  }, renderArticleDetailBody(a));
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
  }, renderProjectDetailBody(p));
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
  { loc: `${SITE_URL}/upstream`, cf: "weekly", pr: "0.8", lm: buildDate },
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

// ── llms.txt (kept in sync with the live essay shelf) ───────────────────────

const essayLinesForLlms = articles
  .map((a) => {
    const month = new Date(`${a.dateISO}T12:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    const form = a.form || a.category || "Essay";
    return `- [${form}] "${a.title}" (${month})\n  ${SITE_URL}/articles/${a.slug}`;
  })
  .join("\n");

const productLines = projects
  .map(
    (p) =>
      `- [${p.name}](${p.liveUrl}): ${p.tagline}. ${p.excerpt} Deep dive: ${SITE}/projects/${p.slug} · Source: ${p.codeUrl}`,
  )
  .join("\n");

const receiptLinesForLlms = upstreamReceipts
  .map((r) => `- ${r.org}/${r.repo}#${r.pr} - ${r.short}`)
  .join("\n");

const llms = `# adityaai.dev

Personal lab site for Aditya Gaurav - AI Researcher & Systems Architect.
Decision tools for people who design production AI systems.

## Person
- Name: Aditya Gaurav
- Role: AI Researcher & Systems Architect
- Location: Sonipat, Haryana, India
- Site: ${SITE_URL}
- GitHub: https://github.com/adi-IL
- LinkedIn: https://www.linkedin.com/in/adityaai/
- X: https://x.com/adityaaidev

## Pages
- Home: ${SITE_URL}/
- About: ${SITE_URL}/about
- Essays: ${SITE_URL}/articles (${articleCount} curated; not a high-volume blog)
- Projects: ${SITE_URL}/projects
- Upstream: ${SITE_URL}/upstream (${upstreamLedger.items.length} merged open-source PRs, generated from the GitHub profile ledger)

## Lab products
${productLines}

## Open-source tools
- [voltcrawl](https://github.com/adi-IL/voltcrawl): MCP server that gives coding agents verified web evidence and headless browser rendering. TypeScript, Playwright. MIT.
- [hq-jr](https://github.com/adi-IL/hq-jr): Self-hosted GitHub App that reviews pull requests with Vertex AI, remembers past findings, and can reproduce bugs in a sandbox before it comments. Apache-2.0.
- [ticking-plasmoid](https://github.com/adi-IL/ticking-plasmoid): Countdown, millisecond stopwatch and quote widget for KDE Plasma 6. KDE Store: https://store.kde.org/p/2370240/
- [ticking-omarchy](https://github.com/adi-IL/ticking-omarchy): Countdown, world clock and stopwatch widget for Omarchy (Hyprland, Quickshell).
- [bad_apple_rs](https://github.com/adi-IL/bad_apple_rs): Rust CLI that plays Bad Apple as ASCII art in the terminal.

## Critical impacts in open source
Static curated receipts on /projects and /upstream (not a live GitHub feed):
${receiptLinesForLlms}

## Essays (shelf)
Forms: Framework | Architecture | Principle.
${essayLinesForLlms}

## Stack
React 19, TypeScript, Vite, Tailwind, Motion, Vercel, Resend, Gemini, Three.js
`;

fs.writeFileSync(path.join(DIST, "llms.txt"), llms, "utf-8");
fs.writeFileSync(path.resolve(__dirname, "..", "public", "llms.txt"), llms, "utf-8");
console.log(`Generated llms.txt (${articles.length} essays)`);
console.log(`✨ Done! Total: ${count} pages, ${entries.length} sitemap URLs, ${articleCount} articles`);
