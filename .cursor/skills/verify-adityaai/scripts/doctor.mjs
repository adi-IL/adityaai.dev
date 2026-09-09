import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.env.ADITYAAI_BASE_URL || 'https://www.adityaai.dev').replace(/\/$/, '');
const verifyDir = process.env.ADITYAAI_VERIFY_DIR || '/tmp/adityaai-verify-doctor';
const artifacts = join(verifyDir, 'artifacts');
mkdirSync(artifacts, { recursive: true });
const logPath = join(artifacts, 'doctor.log');
writeFileSync(logPath, '');

function say(line) {
  const s = `${line}\n`;
  process.stdout.write(s);
  appendFileSync(logPath, s);
}
function fail(msg) {
  say(`fail: ${msg}`);
  process.exit(1);
}

async function codeOf(url) {
  const res = await fetch(url, { redirect: 'follow' });
  return res.status;
}

async function redirOf(url) {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') || '' };
}

say(`doctor base=${base} verify_dir=${verifyDir}`);

for (const path of ['/', '/projects', '/articles', '/about']) {
  const c = await codeOf(`${base}${path}`);
  if (c !== 200) fail(`${path} expected 200 got ${c}`);
  say(`ok ${path} ${c}`);
}

const essays = await redirOf(`${base}/essays`);
if (![301, 308].includes(essays.status)) fail(`/essays expected 301 or 308 got ${essays.status}`);
if (!essays.location.includes('/articles')) fail(`/essays Location missing /articles (${essays.location})`);
say(`ok /essays ${essays.status} -> ${essays.location}`);

const dead = await codeOf(`${base}/articles/does-not-exist-verify-adityaai`);
if (dead !== 404) fail(`dead essay expected 404 got ${dead}`);
say(`ok dead-essay ${dead}`);

const llmsRes = await fetch(`${base}/llms.txt`);
const llms = await llmsRes.text();
if (llmsRes.status !== 200) fail(`llms.txt expected 200 got ${llmsRes.status}`);
if (!llms.includes('adityaai.dev')) fail('llms.txt missing adityaai.dev');
say(`ok /llms.txt ${llmsRes.status}`);

const smRes = await fetch(`${base}/sitemap.xml`);
const sm = await smRes.text();
if (smRes.status !== 200) fail(`sitemap.xml expected 200 got ${smRes.status}`);
if (!sm.includes('www.adityaai.dev')) fail('sitemap missing www.adityaai.dev');
say(`ok /sitemap.xml ${smRes.status}`);

say('doctor ok');
