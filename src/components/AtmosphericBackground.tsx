import { useEffect, useRef } from 'react';
import { initGpu, createFrameLoop, type GpuContext, type FrameLoopController } from '../lib/gpu';

const FOG_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.0;

  float t = u_time * 0.10;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.2)), fbm(p + vec2(t * 0.15, 1.0)));
  vec2 r = vec2(fbm(p + 1.0 * q + vec2(1.7, 9.2) + 0.15 * t), fbm(p + 1.0 * q + vec2(8.3, 2.8) + 0.126 * t));
  float f = fbm(p + r);

  vec3 col = mix(vec3(0.0, 0.0, 0.0), vec3(0.22, 0.24, 0.26), clamp(f * f * 3.2, 0.0, 1.0));
  col = mix(col, vec3(0.78, 0.80, 0.84), clamp(pow(f, 3.0) * 1.6, 0.0, 1.0));

  float vignette = smoothstep(0.0, 0.7, uv.x) * smoothstep(0.0, 0.7, 1.0 - uv.y);
  float alpha = clamp(f * 0.88 * vignette, 0.0, 0.95);

  fragColor = vec4(col, alpha);
}
`;

export default function AtmosphericBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gpuContext: GpuContext | null = null;
    let loopController: FrameLoopController | null = null;
    let cancelled = false;

    initGpu(canvas, { alpha: true, antialias: false, powerPreference: 'low-power' }).then((gpu) => {
      if (cancelled || gpu.backend === 'mock') {
        gpu.dispose();
        return;
      }
      gpuContext = gpu;
      const effect = gpu.createEffect({
        name: 'atmospheric-fog',
        fragment: FOG_FRAGMENT_SHADER,
      });

      loopController = createFrameLoop(
        gpu,
        (frame) => {
          effect.render(frame);
        },
        { dpr: [1, 2], pauseWhenHidden: true },
      );

      loopController.start();
    }).catch(() => {
      // Graceful silence on unsupported contexts
    });

    return () => {
      cancelled = true;
      loopController?.stop();
      gpuContext?.dispose();
    };
  }, []);

  return (
    <div
      className="absolute top-0 right-0 w-full md:w-[80%] h-[100vh] overflow-hidden pointer-events-none z-0"
      style={{
        maskImage: 'radial-gradient(ellipse at 100% 40%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 100% 40%, black 0%, rgba(0,0,0,0.6) 40%, transparent 70%)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

      <div
        className="absolute inset-0 z-20 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
    </div>
  );
}
