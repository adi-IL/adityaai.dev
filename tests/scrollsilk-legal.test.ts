import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const privacyPath = path.join(root, 'public', 'scrollsilk', 'privacy-policy', 'index.html');
const termsPath = path.join(root, 'public', 'scrollsilk', 'terms', 'index.html');

const read = (file: string) => fs.readFileSync(file, 'utf8');

const pages = [
  { name: 'privacy-policy', file: privacyPath, canonical: 'https://www.adityaai.dev/scrollsilk/privacy-policy' },
  { name: 'terms', file: termsPath, canonical: 'https://www.adityaai.dev/scrollsilk/terms' },
];

describe('scrollsilk legal pages', () => {
  for (const page of pages) {
    describe(page.name, () => {
      it('exists as a standalone HTML document', () => {
        assert.ok(fs.existsSync(page.file), `${page.file} is missing`);
        const html = read(page.file);
        assert.match(html, /^<!doctype html>/i);
        assert.match(html, /<html lang="en">/);
        assert.match(html, /<meta name="color-scheme" content="light dark" \/>/);
        assert.match(html, /@media \(prefers-color-scheme: dark\)/);
        assert.match(html, /max-width: 720px/);
      });

      it('declares the expected canonical URL and description', () => {
        const html = read(page.file);
        assert.ok(html.includes(`<link rel="canonical" href="${page.canonical}" />`));
        assert.match(html, /<meta name="description" content="[^"]+" \/>/);
      });

      it('loads no scripts and makes no external requests', () => {
        const html = read(page.file);
        assert.equal(html.match(/<script/gi), null);
        assert.equal(html.match(/<img\b/i), null);
        assert.equal(html.match(/<iframe\b/i), null);
        assert.equal(html.match(/<link\b(?![^>]*rel="canonical")/i), null);
        assert.equal(html.match(/@import/i), null);
        assert.equal(html.match(/url\(/i), null);
        const absoluteUrls = [...html.matchAll(/(?:src|href)="((?:https?:)?\/\/[^"]*)"/gi)].map((m) => m[1]);
        assert.deepEqual(absoluteUrls, [page.canonical], 'only the canonical link may be an absolute URL');
      });

      it('uses plain punctuation only', () => {
        const html = read(page.file);
        assert.equal(html.includes('\u2014'), false, 'found an em dash');
        assert.equal(html.includes('\u2013'), false, 'found an en dash');
        assert.equal(/[\u2018\u2019\u201c\u201d]/.test(html), false, 'found a curly quote');
      });
    });
  }

  it('keeps the privacy policy effective date and its source text', () => {
    const html = read(privacyPath);
    assert.match(html, /<title>Scrollsilk Privacy Policy<\/title>/);
    assert.ok(html.includes('Effective date: 13 November 2026.'));
    assert.ok(html.includes('Scrollsilk collects no personal data.'));
    assert.ok(html.includes('It makes no network requests and has no internet permission.'));
  });

  it('states the trader identity, location, and support email', () => {
    const html = read(termsPath);
    assert.match(html, /<title>Scrollsilk Terms of Service<\/title>/);
    assert.ok(html.includes('Effective date: 15 November 2026.'));
    assert.ok(html.includes('Aditya Gaurav'));
    assert.ok(html.includes('Jalandhar, Punjab, India'));
    assert.ok(html.includes('aiexpert@adityaai.dev'));
    assert.ok(html.includes('href="mailto:aiexpert@adityaai.dev"'));
  });

  it('names the app, the store, and the consumer law disclosures', () => {
    const html = read(termsPath);
    for (const needle of [
      'app.scrollsilk.reader',
      'Android teleprompter',
      'Google Play',
      'EEA',
      'UK',
      'right of withdrawal',
      '14-day',
      'conformity',
      'Directive (EU) 2019/770',
      'Consumer Rights Act 2015',
      'one-time paid app',
      '/scrollsilk/privacy-policy',
    ]) {
      assert.ok(html.includes(needle), `terms page is missing ${needle}`);
    }
  });

  it('states no price and no purchase path outside Google Play', () => {
    const html = read(termsPath);
    assert.equal(html.includes('$5.99'), false);
    assert.equal(html.includes('5.99'), false);
    const externalHrefs = [...html.matchAll(/href="(https?:\/\/[^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(externalHrefs, ['https://www.adityaai.dev/scrollsilk/terms']);
  });
});

describe('scrollsilk legal routes', () => {
  const config = JSON.parse(read(path.join(root, 'vercel.json'))) as {
    redirects: Array<{ source: string; destination: string; permanent?: boolean }>;
    rewrites: Array<{ source: string; destination: string }>;
  };

  it('rewrites both clean URLs to their index.html files', () => {
    for (const route of ['privacy-policy', 'terms']) {
      assert.ok(
        config.rewrites.some(
          (r) => r.source === `/scrollsilk/${route}` && r.destination === `/scrollsilk/${route}/index.html`,
        ),
        `missing rewrite for /scrollsilk/${route}`,
      );
    }
  });

  it('redirects the .html URLs permanently to the clean URLs', () => {
    for (const route of ['privacy-policy', 'terms']) {
      assert.ok(
        config.redirects.some(
          (r) =>
            r.source === `/scrollsilk/${route}.html` &&
            r.destination === `/scrollsilk/${route}` &&
            r.permanent === true,
        ),
        `missing permanent redirect for /scrollsilk/${route}.html`,
      );
    }
  });
});
