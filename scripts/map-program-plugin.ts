import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

// The distribution is minified. Gate every splice on the pinned production
// module's digest and on a unique match; an upgrade uses upstream unchanged.
export function mapProgramPlugin(): Plugin {
  const virtual = "virtual:astra-map-programs";
  return {
    name: "astra-map-program-preparation",
    enforce: "pre",
    resolveId(id) {
      if (id === virtual) return fileURLToPath(new URL("../src/lib/map-program-preparation.ts",import.meta.url));
    },
    transform(code, id) {
      if (!id.replaceAll("\\","/").endsWith("/maplibre-gl/dist/maplibre-gl.mjs")) return;
      if (createHash("sha256").update(code).digest("hex") !== "41198b23679a7d8892183408bbef2eabdc74745beb90261f6be0f660b7aeb2fd") {
        this.warn("Using upstream MapLibre renderer: preparation adapter does not match this distribution.");
        return;
      }
      const splice = (match: string, replacement: string) => {
        if (code.split(match).length !== 2) throw Error(`Map program adapter: ${match}`);
        code = code.replace(match,()=>replacement);
      };
      splice("this.painter=new JN(n)", "astraPrepare(n,bO);this.painter=new JN(n)");
      splice("this.program=l.createProgram();let u=", "let u=");
      splice("x=l.createShader(l.FRAGMENT_SHADER);", "prepared=astraClaim(l,b,y),x=prepared?.fs??l.createShader(l.FRAGMENT_SHADER);this.program=prepared?.program??l.createProgram();");
      splice("l.shaderSource(x,y),l.compileShader(x),l.attachShader(this.program,x);let S=l.createShader(l.VERTEX_SHADER);","if(!prepared){l.shaderSource(x,y);l.compileShader(x);l.attachShader(this.program,x)}let S=prepared?.vs??l.createShader(l.VERTEX_SHADER);");
      splice("l.shaderSource(S,b),l.compileShader(S),l.attachShader(this.program,S),this.attributes={};","if(!prepared){l.shaderSource(S,b);l.compileShader(S);l.attachShader(this.program,S)}this.attributes={};");
      splice("f.length,l.linkProgram(this.program),","f.length,prepared||l.linkProgram(this.program),");
      splice("destroy(){for(let e of Object.values(this.programs))","destroy(){astraDiscard(this.context.gl);for(let e of Object.values(this.programs))");
      return `import {prepare as astraPrepare,claim as astraClaim,discard as astraDiscard} from "${virtual}";\n${code}`;
    },
  };
}
