import type { GpuContext, GpuEffect, GpuFrame, ShaderSpec, UniformValue } from './types';

export interface MockEffectCall {
  frame: GpuFrame;
  uniforms: Record<string, UniformValue>;
}

export interface MockEffect extends GpuEffect {
  readonly renderHistory: MockEffectCall[];
  readonly lastUniforms: Record<string, UniformValue>;
  readonly isDisposed: boolean;
}

export interface MockGpuContext extends GpuContext {
  readonly effects: MockEffect[];
  readonly lastResize: { width: number; height: number; dpr: number } | null;
  readonly isDisposed: boolean;
  createEffect(spec: ShaderSpec): MockEffect;
}

export function createMockContext(canvas?: HTMLCanvasElement): MockGpuContext {
  const activeEffects: MockEffect[] = [];
  let disposed = false;
  let resizeState: { width: number; height: number; dpr: number } | null = null;

  const mockCanvas = canvas ?? ({
    width: 800,
    height: 600,
    style: {},
  } as unknown as HTMLCanvasElement);

  return {
    backend: 'mock',
    canvas: mockCanvas,
    effects: activeEffects,
    get lastResize() {
      return resizeState;
    },
    get isDisposed() {
      return disposed;
    },
    createEffect(spec: ShaderSpec): MockEffect {
      const uniforms: Record<string, UniformValue> = { ...(spec.uniforms ?? {}) };
      const history: MockEffectCall[] = [];
      let effectDisposed = false;

      const effect: MockEffect = {
        name: spec.name,
        renderHistory: history,
        get lastUniforms() {
          return uniforms;
        },
        get isDisposed() {
          return effectDisposed;
        },
        set(nextUniforms: Record<string, UniformValue>) {
          Object.assign(uniforms, nextUniforms);
        },
        render(frame: GpuFrame) {
          if (effectDisposed) return;
          history.push({
            frame: { ...frame },
            uniforms: { ...uniforms },
          });
        },
        dispose() {
          effectDisposed = true;
        },
      };

      activeEffects.push(effect);
      return effect;
    },
    resize(width: number, height: number, dpr = 1) {
      resizeState = { width, height, dpr };
      mockCanvas.width = Math.round(width * dpr);
      mockCanvas.height = Math.round(height * dpr);
    },
    dispose() {
      disposed = true;
      for (const eff of activeEffects) {
        eff.dispose();
      }
      activeEffects.length = 0;
    },
  };
}
