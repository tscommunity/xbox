import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import manifest from "./src/manifest";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const production = mode === "production";

  return {
    server: {
      port: 5173,
      hmr: {
        port: 5173,
        protocol: "ws",
      },
    },
    build: {
      cssCodeSplit: true,
      emptyOutDir: true,
      outDir: "build",
      sourcemap: true,
      minify: false,
      rollupOptions: {
        output: {
          chunkFileNames: "assets/chunk-[hash].js",
          comments: "all",
        },
      },
    },
    esbuild: {
      minifyIdentifiers: false,
      minifySyntax: false,
      minifyWhitespace: false,
      keepNames: true,
      legalComments: "inline",
      dropLabels: [],
      ignoreAnnotations: true,
      sourcemap: true,
    },
    plugins: [crx({ manifest }), vue()],
    legacy: {
      skipWebSocketTokenCheck: true,
    },
  };
});
