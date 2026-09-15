import { createClock, type GpuClock } from './clock';
import type { GpuContext, GpuFrame } from './types';

export interface FrameLoopOptions {
  dpr?: [number, number];
  pauseWhenHidden?: boolean;
  respectReducedMotion?: boolean;
  maxFps?: number;
}

export interface FrameLoopController {
  start(): void;
  stop(): void;
  readonly isRunning: boolean;
  readonly clock: GpuClock;
}

export function createFrameLoop(
  gpu: GpuContext,
  onFrame: (frame: GpuFrame) => void,
  options?: FrameLoopOptions,
): FrameLoopController {
  const clock = createClock();
  const [minDpr, maxDpr] = options?.dpr ?? [1, 2];
  const pauseWhenHidden = options?.pauseWhenHidden ?? true;
  const respectReducedMotion = options?.respectReducedMotion ?? true;
  const maxFps = options?.maxFps;
  const minFrameIntervalMs = maxFps ? 1000 / maxFps : 0;

  let rafId: number | null = null;
  let running = false;
  let lastFrameTimestamp = 0;

  const isMotionReduced = () => {
    if (!respectReducedMotion || typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  };

  const getDpr = () => {
    if (typeof window === 'undefined') return 1;
    const raw = window.devicePixelRatio || 1;
    return Math.min(Math.max(raw, minDpr), maxDpr);
  };

  const step = (timestamp: number) => {
    if (!running) return;

    if (minFrameIntervalMs > 0 && timestamp - lastFrameTimestamp < minFrameIntervalMs) {
      rafId = requestAnimationFrame(step);
      return;
    }

    if (pauseWhenHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      rafId = requestAnimationFrame(step);
      return;
    }

    lastFrameTimestamp = timestamp;

    const canvas = gpu.canvas;
    const width = canvas.clientWidth || canvas.width || 300;
    const height = canvas.clientHeight || canvas.height || 150;
    const dpr = getDpr();

    gpu.resize(width, height, dpr);

    const isReduced = isMotionReduced();
    const tickData = isReduced ? { time: 0, deltaTime: 0, frameCount: 1 } : clock.tick(timestamp);

    const frame: GpuFrame = {
      time: tickData.time,
      deltaTime: tickData.deltaTime,
      frameCount: tickData.frameCount,
      width,
      height,
      dpr,
    };

    onFrame(frame);

    if (!isReduced) {
      rafId = requestAnimationFrame(step);
    }
  };

  const handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible' && running && rafId === null) {
      clock.reset();
      rafId = requestAnimationFrame(step);
    }
  };

  return {
    get isRunning() {
      return running;
    },
    get clock() {
      return clock;
    },
    start() {
      if (running) return;
      running = true;
      clock.reset();

      if (pauseWhenHidden && typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }

      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(step);
      } else {
        const width = gpu.canvas.clientWidth || gpu.canvas.width || 300;
        const height = gpu.canvas.clientHeight || gpu.canvas.height || 150;
        gpu.resize(width, height, 1);
        onFrame({
          time: 0,
          deltaTime: 0,
          frameCount: 1,
          width,
          height,
          dpr: 1,
        });
      }
    },
    stop() {
      if (!running) return;
      running = false;

      if (pauseWhenHidden && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
