import type { GpuContext, GpuEffect, GpuFrame, ShaderSpec, UniformValue } from './types';

export interface GPUInterface {
  requestAdapter(options?: { powerPreference?: string }): Promise<GPUAdapterInterface | null>;
  getPreferredCanvasFormat(): string;
}

export interface GPUAdapterInterface {
  requestDevice(): Promise<GPUDeviceInterface>;
}

export interface GPUBufferInterface {
  destroy(): void;
}

export interface GPUDeviceInterface {
  createShaderModule(descriptor: { code: string }): unknown;
  createBuffer(descriptor: { size: number; usage: number }): GPUBufferInterface;
  createBindGroupLayout(descriptor: unknown): unknown;
  createBindGroup(descriptor: unknown): unknown;
  createPipelineLayout(descriptor: unknown): unknown;
  createRenderPipeline(descriptor: unknown): unknown;
  createCommandEncoder(): {
    beginRenderPass(descriptor: unknown): {
      setPipeline(pipeline: unknown): void;
      setBindGroup(index: number, bindGroup: unknown): void;
      draw(vertexCount: number): void;
      end(): void;
    };
    finish(): unknown;
  };
  queue: {
    writeBuffer(buffer: GPUBufferInterface, offset: number, data: BufferSource): void;
    submit(commandBuffers: unknown[]): void;
  };
  destroy(): void;
}

export interface GPUCanvasContextInterface {
  configure(descriptor: { device: GPUDeviceInterface; format: string; alphaMode?: string }): void;
  getCurrentTexture(): {
    createView(): unknown;
  };
}

const DEFAULT_WGSL_VERTEX = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  var out: VertexOutput;
  out.position = vec4f(pos[index], 0.0, 1.0);
  out.uv = (pos[index] + vec2f(1.0, 1.0)) * 0.5;
  return out;
}
`;

const DEFAULT_WGSL_FRAGMENT = `
@group(0) @binding(0) var<uniform> u_data: vec4f;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return vec4f(uv, 0.5 + 0.5 * sin(u_data.x), 1.0);
}
`;

export function createWebGpuContext(
  canvas: HTMLCanvasElement,
  device: GPUDeviceInterface,
  webgpuContext: GPUCanvasContextInterface,
  format: string,
): GpuContext {
  const effects: GpuEffect[] = [];
  let disposed = false;

  return {
    backend: 'webgpu',
    canvas,
    createEffect(spec: ShaderSpec): GpuEffect {
      if (disposed) {
        throw new Error('Cannot create effect on disposed GpuContext');
      }

      const wgslCode = spec.wgsl ?? `${DEFAULT_WGSL_VERTEX}\n${DEFAULT_WGSL_FRAGMENT}`;
      const shaderModule = device.createShaderModule({ code: wgslCode });

      const uniformBufferSize = 256;
      const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: 0x0040 | 0x0008, // UNIFORM | COPY_DST
      });

      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: 0x2, // FRAGMENT
            buffer: { type: 'uniform' },
          },
        ],
      });

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: uniformBuffer },
          },
        ],
      });

      const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      });

      const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: shaderModule,
          entryPoint: 'vs_main',
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fs_main',
          targets: [{ format }],
        },
        primitive: {
          topology: 'triangle-list',
        },
      });

      const uniforms: Record<string, UniformValue> = { ...(spec.uniforms ?? {}) };
      let effectDisposed = false;

      const effect: GpuEffect = {
        name: spec.name,
        set(nextUniforms: Record<string, UniformValue>) {
          Object.assign(uniforms, nextUniforms);
        },
        render(frame: GpuFrame) {
          if (effectDisposed || disposed) return;

          const uniformData = new Float32Array(64);
          uniformData[0] = frame.time;
          uniformData[1] = frame.deltaTime;
          uniformData[2] = frame.width * frame.dpr;
          uniformData[3] = frame.height * frame.dpr;
          uniformData[4] = frame.dpr;

          let offset = 8;
          for (const val of Object.values(uniforms)) {
            if (typeof val === 'number') {
              if (offset < 64) uniformData[offset++] = val;
            } else if (Array.isArray(val) || val instanceof Float32Array) {
              for (let i = 0; i < val.length && offset < 64; i++) {
                uniformData[offset++] = val[i];
              }
            }
          }

          device.queue.writeBuffer(uniformBuffer, 0, uniformData);

          const commandEncoder = device.createCommandEncoder();
          const textureView = webgpuContext.getCurrentTexture().createView();
          const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
              {
                view: textureView,
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                loadOp: 'clear',
                storeOp: 'store',
              },
            ],
          });

          passEncoder.setPipeline(pipeline);
          passEncoder.setBindGroup(0, bindGroup);
          passEncoder.draw(3);
          passEncoder.end();

          device.queue.submit([commandEncoder.finish()]);
        },
        dispose() {
          if (effectDisposed) return;
          effectDisposed = true;
          uniformBuffer.destroy();
        },
      };

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
        webgpuContext.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        });
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const effect of effects) {
        effect.dispose();
      }
      effects.length = 0;
      device.destroy();
    },
  };
}
