export interface GpuClock {
  readonly time: number;
  readonly deltaTime: number;
  readonly frameCount: number;
  tick(timestampMs?: number): { time: number; deltaTime: number; frameCount: number };
  reset(): void;
}

export function createClock(): GpuClock {
  let startTime = -1;
  let lastTime = -1;
  let elapsed = 0;
  let delta = 0;
  let frames = 0;

  return {
    get time() {
      return elapsed;
    },
    get deltaTime() {
      return delta;
    },
    get frameCount() {
      return frames;
    },
    tick(timestampMs?: number) {
      const now = typeof timestampMs === 'number'
        ? timestampMs
        : (typeof performance !== 'undefined' ? performance.now() : Date.now());

      if (startTime < 0) {
        startTime = now;
        lastTime = now;
        elapsed = 0;
        delta = 0;
        frames = 1;
        return { time: 0, deltaTime: 0, frameCount: 1 };
      }

      const diffSec = (now - lastTime) / 1000;
      delta = Math.min(Math.max(diffSec, 0), 0.1);
      elapsed += delta;
      lastTime = now;
      frames += 1;

      return { time: elapsed, deltaTime: delta, frameCount: frames };
    },
    reset() {
      startTime = -1;
      lastTime = -1;
      elapsed = 0;
      delta = 0;
      frames = 0;
    },
  };
}
