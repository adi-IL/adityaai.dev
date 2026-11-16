import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import FloatingChatButton from '../src/components/FloatingChatButton.tsx';
import FloatingCoffeeButton from '../src/components/FloatingCoffeeButton.tsx';
import CommandPalette from '../src/components/CommandPalette.tsx';
import VirtualCoffeePopup from '../src/components/VirtualCoffeePopup.tsx';
import SiteChatWidget from '../src/components/SiteChatWidget.tsx';
import Articles from '../src/pages/Articles.tsx';

describe('ui-sdk surfaces SSR & accessibility', () => {
  it('renders liquid orb floating triggers with accessible labels', () => {
    const chatHtml = renderToStaticMarkup(createElement(FloatingChatButton));
    assert.match(chatHtml, /aria-label="Open lab guide chat"/);
    assert.match(chatHtml, /liquid-orb/);

    const coffeeHtml = renderToStaticMarkup(createElement(FloatingCoffeeButton));
    assert.match(coffeeHtml, /aria-label="Open virtual coffee form"/);
    assert.match(coffeeHtml, /liquid-orb/);
  });

  it('renders closed dialog components cleanly on SSR', () => {
    const cmdHtml = renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/'] }, createElement(CommandPalette)),
    );
    assert.equal(typeof cmdHtml, 'string');

    const vcHtml = renderToStaticMarkup(createElement(VirtualCoffeePopup));
    assert.equal(typeof vcHtml, 'string');

    const chatWidgetHtml = renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/'] }, createElement(SiteChatWidget)),
    );
    assert.equal(typeof chatWidgetHtml, 'string');
  });

  it('renders Articles page with SegmentedControl and Toggle', () => {
    const html = renderToStaticMarkup(
      createElement(
        HelmetProvider,
        null,
        createElement(MemoryRouter, { initialEntries: ['/articles'] }, createElement(Articles)),
      ),
    );
    assert.match(html, /data-slot="segmented-control"/);
    assert.match(html, /data-slot="segmented-control-indicator"/);
    assert.match(html, /data-slot="toggle"/);
    assert.match(html, /Start here/);
  });
});
