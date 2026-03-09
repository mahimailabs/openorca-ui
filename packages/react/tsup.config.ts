import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/components/**/*.tsx",
    "src/hooks/*.ts",
    "src/lib/*.ts",
    "src/contexts/*.tsx",
  ],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  loader: {
    ".png": "copy",
  },
  external: ["react", "react-dom"],
});
