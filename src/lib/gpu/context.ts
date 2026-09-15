import { createWebGL2Effect } from './effect';
import { createMockContext } from './mock';
import type { GpuContext, GpuEffect, GpuOptions, ShaderSpec } from './types';

export async function initGpu(
  canvas: HTMLCanvasElement,
  options?: GpuOptions,
): Promise<GpuContext> {
  const preferredBackend = options?.backend;

  if (preferredBackend === 'mock') {
    return createMockContext(canvas);
  }

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  if (!isBrowser || typeof canvas.getContext !== 'function') {
    return createMockContext(canvas);
  }

  const glOptions: WebGLContextAttributes = {
    alpha: options?.alpha ?? true,
    antialias: options?.antialias ?? false,
    powerPreference: options?.powerPreference ?? 'default',
    premultipliedAlpha: false,
  };

  const gl = canvas.getContext('webgl2', glOptions);
  if (!gl) {
    return createMockContext(canvas);
  }

  const effects: GpuEffect[] = [];
  let disposed = false;

  const context: GpuContext = {
    backend: 'webgl2',
    canvas,
    createEffect(spec: ShaderSpec): GpuEffect {
      if (disposed) {
        throw new Error('Cannot create effect on disposed GpuContext');
      }
      const effect = createWebGL2Effect(gl, spec);
      effects.push(effect);
      return effect;
    },
    resize(width: number, height: number, dpr = 1) {
      if (disposed) return;
      const targetWidth = Math.max(1, Math.round(width * dpr));
      const targetHeight = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        gl.viewport(0, 0, targetWidth, targetHeight);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const effect of effects) {
        effect.dispose();
      }
      effects.length = 0;
      const loseContext = gl.getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    },
  };

  return context;
}
