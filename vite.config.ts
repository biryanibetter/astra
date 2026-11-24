import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";
import { mapProgramPlugin } from "./scripts/map-program-plugin";

export default defineConfig({
  plugins: [
    mapProgramPlugin(),
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
