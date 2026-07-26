import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['cjs'],
  minify: true,
  sourcemap: true,
  clean: true,
  outExtensions: () => ({ js: '.js' }),
  treeshake: true,
  deps: {
    neverBundle: ['react', 'react/jsx-runtime', 'inkdrop'],
    // The published plugin must be self-contained: ipm installs it from the
    // registry (it is in desktop-v6's `autoInstallPackages`) and the tarball
    // excludes node_modules, so the workspace package is bundled in.
    alwaysBundle: ['mermaid', 'panzoom', '@inkdropapp/mermaid']
  },
  outputOptions: {
    codeSplitting: {
      groups: [
        {
          name: 'env',
          test: /[\\/]src[\\/]env\./,
          priority: 20
        },
        {
          // Everything Mermaid-heavy, kept out of the eager entry chunk. The
          // `packages/mermaid` arm matches @inkdropapp/mermaid: pnpm links it
          // as a workspace package, so it resolves to a real path outside
          // node_modules.
          name: 'mermaid',
          test: /node_modules|[\\/]packages[\\/]mermaid[\\/]|[\\/]src[\\/](mermaid|use-config)\./,
          priority: 10
        }
      ]
    }
  }
})
