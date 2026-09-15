export type BackendKind = 'webgpu' | 'webgl2' | 'mock';

export type UniformType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'int';

export type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | Float32Array;

export interface ShaderSpec {
  name: string;
  vertex?: string;
  fragment: string;
  uniforms?: Record<string, UniformValue>;
}

export interface GpuFrame {
  time: number;
  deltaTime: number;
  frameCount: number;
  width: number;
  height: number;
  dpr: number;
}

export interface GpuEffect {
  readonly name: string;
  set(uniforms: Record<string, UniformValue>): void;
  render(frame: GpuFrame): void;
  dispose(): void;
}

export interface GpuContext {
  readonly backend: BackendKind;
  readonly canvas: HTMLCanvasElement;
  createEffect(spec: ShaderSpec): GpuEffect;
  resize(width: number, height: number, dpr?: number): void;
  dispose(): void;
}

export interface GpuOptions {
  backend?: BackendKind;
  alpha?: boolean;
  antialias?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
}
