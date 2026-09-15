import type { GpuEffect, GpuFrame, ShaderSpec, UniformValue } from './types';

const DEFAULT_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create WebGL shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failure: ${info ?? 'unknown error'}`);
  }

  return shader;
}

export function createWebGL2Effect(
  gl: WebGL2RenderingContext,
  spec: ShaderSpec,
): GpuEffect {
  const vertexShader = compileShader(
    gl,
    spec.vertex ?? DEFAULT_VERTEX_SHADER,
    gl.VERTEX_SHADER,
  );
  let fragmentShader: WebGLShader;
  try {
    fragmentShader = compileShader(
      gl,
      spec.fragment,
      gl.FRAGMENT_SHADER,
    );
  } catch (err) {
    gl.deleteShader(vertexShader);
    throw err;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error('Failed to create WebGL program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(`Program link failure: ${info ?? 'unknown error'}`);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  const quadVao = gl.createVertexArray();
  const quadVbo = gl.createBuffer();
  if (!quadVao || !quadVbo) {
    if (quadVao) gl.deleteVertexArray(quadVao);
    if (quadVbo) gl.deleteBuffer(quadVbo);
    gl.deleteProgram(program);
    throw new Error('Failed to allocate WebGL vertex array or buffer');
  }
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
  const quadVertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

  const posAttrib = gl.getAttribLocation(program, 'a_position');
  if (posAttrib >= 0) {
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
  }
  gl.bindVertexArray(null);

  const uniformTypes = new Map<string, number>();
  const uniformLocations = new Map<string, WebGLUniformLocation | null>();

  const activeUniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < activeUniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      const cleanName = info.name.replace(/\[0\]$/, '');
      uniformTypes.set(cleanName, info.type);
    }
  }

  const resolveLocation = (name: string): WebGLUniformLocation | null => {
    if (uniformLocations.has(name)) {
      return uniformLocations.get(name) ?? null;
    }
    const loc = gl.getUniformLocation(program, name);
    uniformLocations.set(name, loc);
    return loc;
  };

  const uniforms: Record<string, UniformValue> = { ...(spec.uniforms ?? {}) };
  let disposed = false;

  const uploadUniform = (name: string, value: UniformValue) => {
    const loc = resolveLocation(name);
    if (!loc) return;

    const uType = uniformTypes.get(name);
    const isInt = uType === gl.INT || uType === gl.BOOL || uType === gl.SAMPLER_2D;

    if (typeof value === 'number') {
      if (isInt) gl.uniform1i(loc, Math.round(value));
      else gl.uniform1f(loc, value);
    } else if (Array.isArray(value)) {
      if (isInt) {
        const rounded = value.map((v) => Math.round(v));
        if (rounded.length === 2) gl.uniform2i(loc, rounded[0], rounded[1]);
        else if (rounded.length === 3) gl.uniform3i(loc, rounded[0], rounded[1], rounded[2]);
        else if (rounded.length === 4) gl.uniform4i(loc, rounded[0], rounded[1], rounded[2], rounded[3]);
        else gl.uniform1i(loc, rounded[0]);
      } else {
        if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
        else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
        else if (value.length === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
      }
    } else if (value instanceof Float32Array) {
      if (value.length === 2) gl.uniform2fv(loc, value);
      else if (value.length === 3) gl.uniform3fv(loc, value);
      else if (value.length === 4) gl.uniform4fv(loc, value);
      else gl.uniform1fv(loc, value);
    }
  };

  return {
    name: spec.name,
    set(nextUniforms: Record<string, UniformValue>) {
      Object.assign(uniforms, nextUniforms);
    },
    render(frame: GpuFrame) {
      if (disposed) return;

      gl.useProgram(program);
      gl.bindVertexArray(quadVao);

      uploadUniform('u_time', frame.time);
      uploadUniform('u_delta', frame.deltaTime);
      uploadUniform('u_resolution', [frame.width * frame.dpr, frame.height * frame.dpr]);
      uploadUniform('u_dpr', frame.dpr);

      for (const [name, val] of Object.entries(uniforms)) {
        uploadUniform(name, val);
      }

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteBuffer(quadVbo);
      gl.deleteVertexArray(quadVao);
      gl.deleteProgram(program);
      uniformLocations.clear();
    },
  };
}
