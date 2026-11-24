import { describe, expect, it, vi } from "vitest";
import { claim, discard, prepare } from "@/lib/map-program-preparation";

const stage = (suffix: string) => ({
  vertexSource: `v${suffix}`,
  fragmentSource: `f${suffix}`,
});
const shaders = {
  prelude: stage("0"),
  projectionMercator: stage("1"),
  symbolSDF: stage("2"),
};
const source = (kind: string, defines: string[]) =>
  [
    "#version 300 es",
    ...defines.map((s) => `#define HAS_UNIFORM_u_${s}`),
    "#define PROJECTION_MERCATOR",
    `${kind}0`,
    `${kind}1`,
    `${kind}2`,
  ].join("\n");
const flags = [
  "fill_color",
  "opacity",
  "halo_color",
  "halo_width",
  "halo_blur",
];

function fixture(extension = true) {
  const mock = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    isContextLost: () => false,
    getExtension: () => (extension ? {} : null),
    createProgram: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    flush: vi.fn(),
  };
  return { mock, gl: mock as unknown as WebGL2RenderingContext };
}

describe("map program preparation", () => {
  it("uses both shader stages and tolerates only order differences in valueless uniform markers", () => {
    const { gl, mock } = fixture();
    const other = fixture();
    const v = source("v", [...flags].reverse()),
      f = source("f", flags);
    prepare(gl, shaders);
    expect(mock.linkProgram).toHaveBeenCalledTimes(1);
    expect(claim(other.gl, v, f)).toBeUndefined();
    expect(claim(gl, `${v}\n#define OTHER`, f)).toBeUndefined();
    expect(claim(gl, v, f.replace("halo_width", "halo_other"))).toBeUndefined();
    expect(claim(gl, v, f)?.program).toBe(
      mock.createProgram.mock.results[0]?.value,
    );
    expect(claim(gl, v, f)).toBeUndefined();
    discard(gl);
    expect(mock.deleteProgram).not.toHaveBeenCalled();
  });

  it("releases unused handles and makes no allocations without the extension", () => {
    const { gl, mock } = fixture();
    prepare(gl, shaders);
    discard(gl);
    discard(gl);
    expect(mock.deleteProgram).toHaveBeenCalledTimes(1);
    expect(mock.deleteShader).toHaveBeenCalledTimes(2);
    const disabled = fixture(false);
    prepare(disabled.gl, shaders);
    expect(disabled.mock.createProgram).not.toHaveBeenCalled();
  });
});
