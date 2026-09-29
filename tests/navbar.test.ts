import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../src/components/Navbar.tsx';

const render = (path: string) =>
  renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Navbar)));
const navLinks = (html: string) =>
  [...html.matchAll(/<a ([^>]*)>([^<]*)/g)].map(([, attrs, text]) => ({
    href: /href="([^"]+)"/.exec(attrs)![1],
    cls: /class="([^"]*)"/.exec(attrs)![1],
    text,
  }));

describe('navbar', () => {
  it('lists Upstream right after Projects', () => {
    assert.deepEqual(navLinks(render('/')).map((l) => [l.text, l.href]), [
      ['Home', '/'], ['Essays', '/articles'], ['Projects', '/projects'], ['Upstream', '/upstream'], ['About', '/about'],
    ]);
  });

  it('marks Upstream active on /upstream, with the same classes Projects gets on /projects', () => {
    const up = navLinks(render('/upstream'));
    const active = up.filter((l) => l.cls.split(' ').includes('text-zinc-50'));
    assert.deepEqual(active.map((l) => l.href), ['/upstream']);
    const proj = navLinks(render('/projects')).find((l) => l.href === '/projects')!;
    assert.equal(up.find((l) => l.href === '/upstream')!.cls, proj.cls);
    assert.match(render('/upstream'), /href="\/upstream"[^>]*>Upstream<div class="absolute -bottom-1/);
  });
});
