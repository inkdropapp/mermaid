import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  deps: {
    // `mermaid` / `panzoom` / `react` are peers: hosts install and dedupe them.
    // Bundling `mermaid` here would give a page two copies racing over
    // `mermaid.initialize()`'s module-global config.
    neverBundle: ['react', 'react/jsx-runtime', 'mermaid', 'panzoom']
  }
})
