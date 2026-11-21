import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [pluginReact()],
  source: { entry: { index: path.join(root, "src/main.tsx") } },
  html: {
    title: "Vishwa Gateway — Model Token MaaS",
    meta: { description: "Explore a unified gateway for AI model tokens." },
  },
  server: {
    host: "127.0.0.1",
    port: 3003,
    strictPort: true,
    publicDir: { name: path.join(root, "public") },
  },
  output: { distPath: { root: path.join(root, "dist") }, cleanDistPath: true, sourceMap: false },
  performance: { printFileSize: false },
});
