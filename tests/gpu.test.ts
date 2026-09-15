import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/lib/gpu/clock.ts';
import { createMockContext } from '../src/lib/gpu/mock.ts';
import { initGpu } from '../src/lib/gpu/context.ts';
import { createFrameLoop } from '../src/lib/gpu/loop.ts';

describe('GPU Engine - Clock', () => {
  it('initializes with zeroed elapsed and delta', () => {
    const clock = createClock();
    assert.equal(clock.time, 0);
    assert.equal(clock.deltaTime, 0);
    assert.equal(clock.frameCount, 0);
  });

  it('calculates elapsed time and delta on successive ticks', () => {
    const clock = createClock();
    const t0 = clock.tick(1000);
    assert.equal(t0.time, 0);
    assert.equal(t0.deltaTime, 0);
    assert.equal(t0.frameCount, 1);

    const t1 = clock.tick(1050);
    assert.equal(Math.round(t1.time * 1000), 50);
    assert.equal(Math.round(t1.deltaTime * 1000), 50);
    assert.equal(t1.frameCount, 2);

    const t2 = clock.tick(1100);
    assert.equal(Math.round(t2.time * 1000), 100);
    assert.equal(Math.round(t2.deltaTime * 1000), 50);
    assert.equal(t2.frameCount, 3);
  });

  it('clamps delta time and advances elapsed only by clamped delta on tab delay', () => {
    const clock = createClock();
    clock.tick(1000);
    const jump = clock.tick(5000);
    assert.equal(jump.deltaTime, 0.1);
    assert.equal(Math.round(jump.time * 100), 10);
  });

  it('resets time and frames on reset', () => {
    const clock = createClock();
    clock.tick(1000);
    clock.tick(1050);
    clock.reset();
    assert.equal(clock.time, 0);
    assert.equal(clock.frameCount, 0);
  });
});

describe('GPU Engine - Mock Context & Uniform Reflection', () => {
  it('records effect uniform mutations and renders', () => {
    const ctx = createMockContext();
    const effect = ctx.createEffect({
      name: 'test-shader',
      fragment: '#version 300 es\nvoid main(){}',
      uniforms: {
        u_speed: 1.5,
        u_color: [0.8, 1.0, 0.0],
      },
    });

    assert.equal(effect.name, 'test-shader');
    assert.equal(effect.lastUniforms.u_speed, 1.5);
    assert.deepEqual(effect.lastUniforms.u_color, [0.8, 1.0, 0.0]);

    effect.set({ u_speed: 2.0 });
    assert.equal(effect.lastUniforms.u_speed, 2.0);

    effect.render({
      time: 1.2,
      deltaTime: 0.016,
      frameCount: 60,
      width: 1920,
      height: 1080,
      dpr: 2,
    });

    assert.equal(effect.renderHistory.length, 1);
    assert.equal(effect.renderHistory[0].frame.time, 1.2);
    assert.equal(effect.renderHistory[0].uniforms.u_speed, 2.0);
  });

  it('deep-clones uniform array values in render history', () => {
    const ctx = createMockContext();
    const effect = ctx.createEffect({
      name: 'test-clone',
      fragment: '',
      uniforms: { u_coords: [10, 20] },
    });

    effect.render({ time: 0, deltaTime: 0, frameCount: 1, width: 100, height: 100, dpr: 1 });
    effect.set({ u_coords: [99, 100] });

    assert.deepEqual(effect.renderHistory[0].uniforms.u_coords, [10, 20]);
    assert.deepEqual(effect.lastUniforms.u_coords, [99, 100]);
  });

  it('updates canvas dimensions on resize with dpr', () => {
    const ctx = createMockContext();
    ctx.resize(500, 300, 2);
    assert.equal(ctx.canvas.width, 1000);
    assert.equal(ctx.canvas.height, 600);
    assert.deepEqual(ctx.lastResize, { width: 500, height: 300, dpr: 2 });
  });

  it('disposes all child effects on context disposal and forbids new effects', () => {
    const ctx = createMockContext();
    const effect1 = ctx.createEffect({ name: 'e1', fragment: '' });
    const effect2 = ctx.createEffect({ name: 'e2', fragment: '' });

    assert.equal(ctx.isDisposed, false);
    assert.equal(effect1.isDisposed, false);
    assert.equal(effect2.isDisposed, false);

    ctx.dispose();
    assert.equal(ctx.isDisposed, true);
    assert.equal(effect1.isDisposed, true);
    assert.equal(effect2.isDisposed, true);

    assert.throws(() => ctx.createEffect({ name: 'e3', fragment: '' }), /disposed/);
  });
});

describe('GPU Engine - Factory & Frame Loop', () => {
  it('falls back to mock context gracefully in headless Node', async () => {
    const fakeCanvas = {} as HTMLCanvasElement;
    const ctx = await initGpu(fakeCanvas);
    assert.equal(ctx.backend, 'mock');
  });

  it('starts, renders in mock environment, and stops', async () => {
    const ctx = createMockContext();
    let renderedFrames = 0;

    const loop = createFrameLoop(ctx, (frame) => {
      renderedFrames += 1;
      assert.equal(frame.frameCount, 1);
    });

    assert.equal(loop.isRunning, false);
    loop.start();
    assert.equal(loop.isRunning, true);
    if (typeof requestAnimationFrame === 'undefined') {
      assert.equal(renderedFrames, 1);
    }

    loop.stop();
    assert.equal(loop.isRunning, false);
  });

  it('does not compound canvas backing dimensions when clientWidth is zero', () => {
    const fakeCanvas = { clientWidth: 0, clientHeight: 0, width: 300, height: 150 } as HTMLCanvasElement;
    const ctx = createMockContext(fakeCanvas);
    const loop = createFrameLoop(ctx, () => {}, { dpr: [2, 2] });
    loop.start();
    assert.equal(fakeCanvas.width, 600);
    loop.stop();
  });

  it('throws when webgpu is explicitly requested without environment support', async () => {
    const fakeCanvas = {} as HTMLCanvasElement;
    await assert.rejects(
      async () => initGpu(fakeCanvas, { backend: 'webgpu' }),
      /WebGPU is not supported/,
    );
  });

  it('initializes webgpu backend when navigator.gpu adapter and device succeed', async () => {
    const fakeCanvas = {
      getContext(type: string) {
        if (type === 'webgpu') {
          return {
            configure() {},
            getCurrentTexture() {
              return { createView: () => ({}) };
            },
          };
        }
        return null;
      },
      width: 800,
      height: 600,
    } as unknown as HTMLCanvasElement;

    const mockDevice = {
      createShaderModule: () => ({}),
      createBuffer: () => ({ destroy: () => {} }),
      createBindGroupLayout: () => ({}),
      createBindGroup: () => ({}),
      createPipelineLayout: () => ({}),
      createRenderPipeline: () => ({}),
      createCommandEncoder: () => ({
        beginRenderPass: () => ({
          setPipeline: () => {},
          setBindGroup: () => {},
          draw: () => {},
          end: () => {},
        }),
        finish: () => ({}),
      }),
      queue: {
        writeBuffer: () => {},
        submit: () => {},
      },
      destroy: () => {},
    };
    const mockGpu = {
      requestAdapter: async () => ({
        requestDevice: async () => mockDevice,
      }),
      getPreferredCanvasFormat: () => 'bgra8unorm',
    };

    Object.defineProperty(globalThis.navigator, 'gpu', {
      value: mockGpu,
      configurable: true,
      writable: true,
    });

    try {
      const ctx = await initGpu(fakeCanvas);
      assert.equal(ctx.backend, 'webgpu');
      const effect = ctx.createEffect({ name: 'wgsl-test' });
      effect.render({ time: 1, deltaTime: 0.016, frameCount: 1, width: 800, height: 600, dpr: 1 });
      ctx.dispose();
    } finally {
      delete (globalThis.navigator as unknown as { gpu?: unknown }).gpu;
    }
  });
});
