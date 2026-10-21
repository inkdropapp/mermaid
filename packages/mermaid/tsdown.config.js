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
    // `react` is a peer and `pele` a dependency: hosts install and dedupe
    // them, and bundle Pele themselves (the plugin does).
    neverBundle: ['react', 'react/jsx-runtime', 'pele']
  }
})
