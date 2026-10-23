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
    alwaysBundle: ['pele', '@inkdropapp/mermaid']
  },
  outputOptions: {
    codeSplitting: {
      groups: [
        {
          // Small modules both the entry and the lazy chunk use. Grouped
          // apart, or the mermaid group would take them along with
          // src/mermaid.tsx and the entry would load that chunk eagerly.
          name: 'env',
          test: /[\\/]src[\\/](env|use-math)\./,
          priority: 20
        },
        {
          // KaTeX, loaded only once a diagram contains math (see use-math.ts).
          // src/math.ts stays out of every group: it imports the package, which
          // a group would pull in with it.
          name: 'katex',
          test: /[\\/]node_modules[\\/]katex[\\/]/,
          priority: 15
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
