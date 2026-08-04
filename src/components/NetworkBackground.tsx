import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-expect-error vanta has no types for this deep import
import NET from 'vanta/src/vanta.net';

export default function NetworkBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vantaEffect: { destroy: () => void } | null = null;
    
    if (vantaRef.current) {
      vantaEffect = NET({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xccff00, // electric lime
        backgroundColor: 0x000000,
        points: 10.00,
        maxDistance: 22.00,
        spacing: 20.00,
        showDots: true
      });
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  return (
    <div
      className="absolute top-0 bottom-0 left-0 right-0 min-h-[300vh] overflow-hidden pointer-events-none z-0"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0, transparent 90vh, black 115vh, black calc(100% - 120px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, transparent 90vh, black 115vh, black calc(100% - 120px), transparent 100%)'
      }}
    >
      {/* Vanta Net Canvas Container */}
      <div ref={vantaRef} className="absolute inset-0 z-0 pointer-events-auto opacity-20"></div>

      {/* Deep dark overlay to blend the glows into the background */}
      <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none"></div>
    </div>
  );
}
