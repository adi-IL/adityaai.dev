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
  let runGeneration = 0;
  let fallbackWidth = 300;
  let fallbackHeight = 150;

  const isMotionReduced = () => {
    if (!respectReducedMotion || typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  };

  const motionMediaQuery = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  const getDpr = () => {
    const raw = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : minDpr;
    return Math.min(Math.max(raw, minDpr), maxDpr);
  };

  const step = (timestamp: number) => {
    if (!running) return;
    const currentGeneration = runGeneration;

    if (minFrameIntervalMs > 0 && timestamp - lastFrameTimestamp < minFrameIntervalMs) {
      rafId = requestAnimationFrame(step);
      return;
    }

    if (pauseWhenHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      rafId = null;
      return;
    }

    lastFrameTimestamp = timestamp;

    const canvas = gpu.canvas;
    if (canvas.clientWidth > 0) fallbackWidth = canvas.clientWidth;
    if (canvas.clientHeight > 0) fallbackHeight = canvas.clientHeight;
    const width = canvas.clientWidth > 0 ? canvas.clientWidth : fallbackWidth;
    const height = canvas.clientHeight > 0 ? canvas.clientHeight : fallbackHeight;
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

    if (running && runGeneration === currentGeneration && !isReduced) {
      rafId = requestAnimationFrame(step);
    }
  };

  const handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible' && running && rafId === null) {
      clock.reset();
      lastFrameTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
      rafId = requestAnimationFrame(step);
    }
  };

  const handleMotionChange = () => {
    if (running && rafId === null && !isMotionReduced()) {
      clock.reset();
      lastFrameTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
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
      runGeneration += 1;
      clock.reset();

      if (pauseWhenHidden && typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
      motionMediaQuery?.addEventListener?.('change', handleMotionChange);

      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(step);
      } else {
        const width = gpu.canvas.clientWidth > 0 ? gpu.canvas.clientWidth : fallbackWidth;
        const height = gpu.canvas.clientHeight > 0 ? gpu.canvas.clientHeight : fallbackHeight;
        const dpr = getDpr();
        gpu.resize(width, height, dpr);
        onFrame({
          time: 0,
          deltaTime: 0,
          frameCount: 1,
          width,
          height,
          dpr,
        });
      }
    },
    stop() {
      if (!running) return;
      running = false;
      runGeneration += 1;

      if (pauseWhenHidden && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      motionMediaQuery?.removeEventListener?.('change', handleMotionChange);

      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
