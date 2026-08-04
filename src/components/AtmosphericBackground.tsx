import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-expect-error vanta has no types for this deep import
import FOG from 'vanta/src/vanta.fog';

export default function AtmosphericBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vantaEffect: { destroy: () => void } | null = null;
    
    if (vantaRef.current) {
      vantaEffect = FOG({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0xdcdcdc, // Light grey/white
        midtoneColor: 0x555555,   // Mid grey
        lowlightColor: 0x000000,  // Black
        baseColor: 0x000000,      // Pure black
        blurFactor: 0.75,
        speed: 1.2,
        zoom: 1.0
      });
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  return (
    <div 
      className="absolute top-0 right-0 w-full md:w-[80%] h-[100vh] overflow-hidden pointer-events-none z-0"
      style={{
        maskImage: 'radial-gradient(ellipse at 100% 40%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 100% 40%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%)'
      }}
    >
      {/* Vanta Fog Canvas Container */}
      <div ref={vantaRef} className="absolute inset-0 z-0 pointer-events-auto"></div>

      {/* SVG Noise/Grain Overlay for cinematic feel */}
      <div 
        className="absolute inset-0 z-20 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      ></div>
      
      {/* Deep dark overlay to blend the glows into the background */}
      <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none"></div>
    </div>
  );
}
