// Diagnostic-only: per-package chunking to attribute bundle weight.
// Not the real deliverable — see vite.web-component.config.ts for the single-bundle measure.
import base from "./vite.web-component.config";

export default {
  ...base,
  build: {
    ...base.build,
    outDir: "dist-web-component-analyze",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            const m = id.split("node_modules/")[1].split("/");
            const pkg = m[0].startsWith("@") ? `${m[0]}/${m[1]}` : m[0];
            return "npm/" + pkg.replace("/", "__");
          }
        },
      },
    },
  },
};
