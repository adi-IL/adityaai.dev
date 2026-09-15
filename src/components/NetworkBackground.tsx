import { useEffect, useRef } from 'react';
import { initGpu, createFrameLoop, type GpuContext, type FrameLoopController } from '../lib/gpu';

const NETWORK_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}

float dfLine(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 st = vec2(uv.x * aspect, uv.y) * 12.0;

  vec2 i_st = floor(st);
  vec2 f_st = fract(st);

  float t = u_time * 0.35;
  vec3 lime = vec3(0.8, 1.0, 0.0);

  vec2 points[9];
  int idx = 0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 cellId = i_st + neighbor;
      vec2 h = hash2(cellId);
      vec2 pos = neighbor + 0.5 + 0.32 * sin(t + 6.2831 * h);
      points[idx] = pos;
      idx += 1;
    }
  }

  float nodeGlow = 0.0;
  float lineGlow = 0.0;

  for (int i = 0; i < 9; i++) {
    float d = length(f_st - points[i]);
    nodeGlow += smoothstep(0.12, 0.02, d) * 1.4;
    nodeGlow += smoothstep(0.35, 0.0, d) * 0.25;

    for (int j = i + 1; j < 9; j++) {
      float distNodes = length(points[i] - points[j]);
      if (distNodes < 1.35) {
        float lineDist = dfLine(f_st, points[i], points[j]);
        float lineFade = 1.0 - (distNodes / 1.35);
        lineGlow += smoothstep(0.035, 0.005, lineDist) * lineFade * 0.65;
      }
    }
  }

  float totalIntensity = nodeGlow + lineGlow;
  vec3 col = lime * totalIntensity;
  float alpha = clamp(totalIntensity * 0.6, 0.0, 0.85);

  fragColor = vec4(col, alpha);
}
`;

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gpuContext: GpuContext | null = null;
    let loopController: FrameLoopController | null = null;
    let cancelled = false;

    initGpu(canvas, { alpha: true, antialias: false, powerPreference: 'low-power' }).then((gpu) => {
      if (cancelled) {
        gpu.dispose();
        return;
      }
      gpuContext = gpu;
      const effect = gpu.createEffect({
        name: 'network-lattice',
        fragment: NETWORK_FRAGMENT_SHADER,
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
      className="absolute top-0 bottom-0 left-0 right-0 min-h-[300vh] overflow-hidden pointer-events-none z-0"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0, transparent 90vh, black 115vh, black calc(100% - 120px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, transparent 90vh, black 115vh, black calc(100% - 120px), transparent 100%)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto opacity-20" />
      <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none" />
    </div>
  );
}
