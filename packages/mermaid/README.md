# @inkdropapp/mermaid

React components for rendering [Mermaid](https://mermaid.js.org/) diagrams that follow
the host's theme, with drag-to-pan / scroll-to-zoom and a hover toolbar.

Extracted from the [Inkdrop Mermaid plugin](https://github.com/inkdropapp/inkdrop-mermaid)
so the plugin, the website demo, and the mobile web editor can share one implementation
instead of each carrying a port of it.

The guiding principle: **this package is host-agnostic.** It imports no Inkdrop API.
Everything host-specific — the button component, print mode, the theme signal — arrives
as a prop, so the same component works inside the desktop app, a Next.js page, or a
mobile WebView.

## Install

```shell
npm install @inkdropapp/mermaid
```

`react`, `mermaid`, and `panzoom` are **peer dependencies** — the host installs and
dedupes them. That is deliberate: two copies of `mermaid` on a page race over
`mermaid.initialize()`'s module-global config.

## Required stylesheets

Two sheets, and **both are load-bearing**:

```ts
import '@inkdropapp/css/mermaid.css' // the --mermaid-* design tokens
import '@inkdropapp/mermaid/styles.css' // component layout (diagram, toolbar)
```

`@inkdropapp/css/mermaid.css` defines the `--mermaid-*` custom properties this package
resolves colours from. They carry **no fallbacks** — without that sheet a diagram renders
structurally correct but unpainted. There is no runtime warning for this; if diagrams come
out blank, check that sheet first.

## Usage

```tsx
import { MermaidDiagram } from '@inkdropapp/mermaid'

export function Diagram() {
  return <MermaidDiagram code="graph TD; A-->B;" />
}
```

With a host button component and a theme signal:

```tsx
import { MermaidDiagram } from '@inkdropapp/mermaid'
import { UIButton } from '@inkdropapp/uikit'
import { MarkdownRendererContext } from '@inkdropapp/markdown'

function Diagram({ code }: { code: string }) {
  const { printMode } = useContext(MarkdownRendererContext)
  const theme = useTheme() // whatever the host uses

  return (
    <MermaidDiagram code={code} Button={UIButton} printMode={printMode} themeRevision={theme} />
  )
}
```

### Props

| Prop               | Default | Description                                                                                                    |
| ------------------ | ------- | -------------------------------------------------------------------------------------------------------------- |
| `code`             | —       | The diagram source (the body of a ` ```mermaid ` block).                                                       |
| `Button`           | —       | The host's button component, used for the toolbar. Without one the toolbar renders nothing.                    |
| `printMode`        | `false` | Render for print/export: pins colours to their light variants and hides the toolbar and pan/zoom.              |
| `toolbar`          | `true`  | Show the hover toolbar. Ignored in print mode.                                                                 |
| `panZoom`          | `true`  | Enable drag-to-pan and Ctrl/Cmd + scroll zoom. Ignored in print mode.                                          |
| `fill`             | `false` | Size the diagram to its container and keep the toolbar visible, for full-screen / lightbox shells.             |
| `themeRevision`    | —       | Any value that changes when the host's theme changes; triggers a re-render.                                    |
| `themeSwapDelayMs` | `400`   | Wait before that re-render, so the new theme's stylesheet has swapped in. Set `0` for synchronous theme swaps. |
| `onExpand`         | —       | When set, the toolbar shows an expand button that calls this.                                                  |

### Why `themeRevision` exists

Colours are resolved from CSS and **baked into the SVG at render time**, so an
already-rendered diagram does not follow a live theme switch on its own. Pass a value that
changes with the theme and the diagram re-renders. The default `themeSwapDelayMs` covers
the gap between a theme being selected and its stylesheet actually being applied.

### Full-screen

The package renders the diagram; the host supplies the shell (backdrop, padding, close
button). Pass `fill` so the diagram sizes to that shell:

```tsx
<div className="my-lightbox">
  <MermaidDiagram code={code} Button={UIButton} fill />
  <CloseButton />
</div>
```

## Also exported

`useMermaidRendering`, `usePanZoom`, `MermaidToolbar`, `buildInkdropThemeVariables`, and
the toolbar icons — for hosts that want to compose their own layout instead of using
`MermaidDiagram`.

## A note on Mermaid versions

`buildInkdropThemeVariables` emits **complete** nested config objects for the diagram types
Mermaid exposes that way (`packet`, `xyChart`, `radar`, `wardley`, `cynefin`), because
Mermaid re-applies override objects verbatim and a partial one would drop its siblings.
The non-colour values in those objects (widths, font sizes, `plotColorPalette`) are copied
from Mermaid's `theme-base.js`, so **re-check them when bumping Mermaid's minor version**.

## License

MIT
