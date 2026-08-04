import { useEffect, useState } from 'react';

/**
 * Returns `true` once the page has scrolled past `threshold` pixels. Uses an
 * IntersectionObserver on a zero-height sentinel instead of a scroll listener
 * so there's no per-frame state update - state only flips twice per page
 * (once entering, once returning). Drops JS work on every frame of scrolling.
 */
export function useScrolledPast(threshold = 200): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    // Inject a sentinel at the threshold position. When it leaves the top of
    // the viewport, we know we've scrolled past it.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    Object.assign(sentinel.style, {
      position: 'absolute',
      top: `${threshold}px`,
      left: '0',
      width: '1px',
      height: '1px',
      pointerEvents: 'none',
    });
    document.body.appendChild(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, [threshold]);

  return past;
}
