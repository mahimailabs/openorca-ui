import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/clawData.ts", "src/knowledge.ts", "src/runtime.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
