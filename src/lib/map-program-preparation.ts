// Speculative links only. MapLibre still decides what to draw, checks the real
// link status, and owns every binding, uniform, draw, error and adopted handle.
type GL = WebGL2RenderingContext;
type Stage = { vertexSource: string; fragmentSource: string };
type Handles = { program: WebGLProgram; vs: WebGLShader; fs: WebGLShader };
const pending = new WeakMap<GL, Map<string, Handles>>();
const variants: Record<string, string> = {
  sky: "",
  background: "",
  clippingMask: "",
  fill: "color outline_color opacity pattern_to pattern_from pixel_ratio_to pixel_ratio_from",
  fillOutline:
    "color opacity outline_color pattern_to pattern_from pixel_ratio_to pixel_ratio_from",
  line: "color width floorwidth opacity gapwidth offset blur dasharray_to dasharray_from pattern_to pattern_from pixel_ratio_to pixel_ratio_from",
  lineSDF:
    "color dasharray_to dasharray_from opacity width floorwidth gapwidth offset blur pattern_to pattern_from pixel_ratio_to pixel_ratio_from",
  symbolSDF: "fill_color opacity halo_color halo_width halo_blur",
  circle: "color stroke_color stroke_width blur opacity stroke_opacity",
};

function key(source: string) {
  // Independent, valueless marker declarations. Reordering these before the
  // first use has no GLSL semantics. Never reorder extension directives,
  // macro expressions or any shader body text.
  return source.replace(
    /^(#version 300 es\n)((?:#define HAS_UNIFORM_u_\w+\n)+)/,
    (_, version: string, defines: string) =>
      `${version}${defines.trimEnd().split("\n").sort().join("\n")}\n`,
  );
}
const pairKey = (v: string, f: string) => JSON.stringify([key(v), key(f)]);

export function discard(gl: GL) {
  const cache = pending.get(gl);
  if (!cache) return;
  pending.delete(gl);
  for (const { program, vs, fs } of cache.values()) {
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  }
}

export function prepare(gl: GL, shaders: Record<string, Stage>) {
  discard(gl);
  if (gl.isContextLost() || !gl.getExtension("KHR_parallel_shader_compile"))
    return;
  const cache = new Map<string, Handles>();
  pending.set(gl, cache);
  const prelude = shaders.prelude;
  const mercator = shaders.projectionMercator;
  if (!prelude || !mercator) return;
  for (const [name, flags] of Object.entries(variants)) {
    const stage = shaders[name];
    if (!stage || gl.isContextLost()) continue;
    const prefix = [
      "#version 300 es",
      ...flags
        .split(" ")
        .filter(Boolean)
        .map((flag) => `#define HAS_UNIFORM_u_${flag}`),
      "#define PROJECTION_MERCATOR",
    ];
    const src = (k: keyof Stage) =>
      [...prefix, prelude[k], mercator[k], stage[k]].join("\n");
    const v = src("vertexSource"),
      f = src("fragmentSource");
    const id = pairKey(v, f);
    if (cache.has(id)) continue;
    const program = gl.createProgram(),
      vs = gl.createShader(gl.VERTEX_SHADER),
      fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!program || !vs || !fs) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      break;
    }
    gl.shaderSource(vs, v);
    gl.compileShader(vs);
    gl.attachShader(program, vs);
    gl.shaderSource(fs, f);
    gl.compileShader(fs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    cache.set(id, { program, vs, fs });
  }
  gl.flush();
}

export function claim(gl: GL, vertex: string, fragment: string) {
  const cache = pending.get(gl);
  if (!cache?.size) return;
  const id = pairKey(vertex, fragment),
    handles = cache.get(id);
  if (handles) cache.delete(id);
  return handles;
}
