# @inkdropapp/mermaid

React components for rendering [Mermaid](https://mermaid.js.org/) diagrams with
[Pele](https://pele.run/), themed by the host's CSS, with zoom, math and a hover toolbar.

Extracted from the [Inkdrop Mermaid plugin](https://github.com/inkdropapp/mermaid) so
the plugin, the website demo, and the mobile web editor can share one implementation
instead of each carrying a port of it.

The guiding principle: **this package is host-agnostic.** It imports no Inkdrop API.
Everything host-specific — the button component, print mode, the theme signal, KaTeX —
arrives as a prop, so the same component works inside the desktop app, a Next.js page, or
a mobile WebView.

## Install

```shell
npm install @inkdropapp/mermaid
```

`react` is the only peer dependency. `pele` is a regular dependency, pinned to an exact
version because `styles.css` targets its markup.

## Required stylesheets

```ts
import '@inkdropapp/css/mermaid.css' // the --mermaid-* design tokens
import '@inkdropapp/mermaid/styles.css' // Pele theming, diagram and toolbar layout
```

`styles.css` maps the `--mermaid-*` custom properties from `@inkdropapp/css/mermaid.css`
onto Pele's `--pele-*` variables, per diagram type. Without the token sheet, diagrams fall
back to Pele's own palette. Colours stay live: a theme switch restyles a drawn diagram
without re-rendering it.

## Usage

```tsx
import { MermaidDiagram } from '@inkdropapp/mermaid'

export function Diagram() {
  return <MermaidDiagram code="graph TD; A-->B;" />
}
```

With a host button component and a theme signal:

```tsx
import { MarkdownRendererContext } from '@inkdropapp/markdown'
import { MermaidDiagram } from '@inkdropapp/mermaid'
import { UIButton } from '@inkdropapp/uikit'

function Diagram({ code }: { code: string }) {
  const { printMode } = useContext(MarkdownRendererContext)
  const theme = useTheme() // whatever the host uses

  return (
    <MermaidDiagram code={code} Button={UIButton} printMode={printMode} themeRevision={theme} />
  )
}
```

### Props

| Prop               | Default | Description                                                                                                                                     |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`             | —       | The diagram source (the body of a ` ```mermaid ` block).                                                                                        |
| `Button`           | —       | The host's button component, used for the toolbar. Without one the toolbar renders nothing.                                                     |
| `printMode`        | `false` | Render for print/export: light colours (`color-scheme: light`), no toolbar and no zoom.                                                         |
| `toolbar`          | `true`  | Show the hover toolbar. Ignored in print mode.                                                                                                  |
| `panZoom`          | `true`  | Enable Ctrl/Cmd + scroll and pinch zoom, and drag-to-pan while zoomed. Inline, only diagrams shrunk to fit are zoomable. Ignored in print mode. |
| `fill`             | `false` | Fit the diagram to its container in both axes, make any diagram zoomable, and keep the toolbar visible. For full-screen / lightbox shells.      |
| `math`             | —       | Typesets `$$...$$` in labels; without it they show the TeX source. See [Math](#math).                                                           |
| `themeRevision`    | —       | Any value that changes when the host's theme changes; re-measures labels in the new theme's font.                                               |
| `themeSwapDelayMs` | `400`   | Wait before re-measuring, so the new theme's stylesheet has swapped in. Set `0` for synchronous theme swaps.                                    |
| `onExpand`         | —       | When set, the toolbar shows an expand button that calls this.                                                                                   |

### Why `themeRevision` exists

Colours follow the theme on their own, but Pele measures label text when it lays a
diagram out. A theme can change the font, so pass a value that changes with the theme and
the diagram is re-measured. The default `themeSwapDelayMs` covers the gap between a theme
being selected and its stylesheet being applied.

### Full-screen

The package renders the diagram; the host supplies the shell (backdrop, padding, close
button). Pass `fill` so the diagram sizes to that shell:

```tsx
<div className="my-lightbox">
  <MermaidDiagram code={code} Button={UIButton} fill />
  <CloseButton />
</div>
```

The zoom level is kept when the shell resizes, and the dot grid behind the diagram pans
and zooms with it.

### Math

The package doesn't bundle KaTeX. Build a resolver from the host's copy with
`createKatexMath`, once at module level, since a new function re-renders the diagram:

```tsx
import { createKatexMath, MermaidDiagram } from '@inkdropapp/mermaid'
import katex from 'katex'

const math = createKatexMath(katex)

;<MermaidDiagram code={code} math={math} />
```

Formulas are rendered as MathML, which needs no KaTeX stylesheet or fonts, and measured
once in a hidden element. `styles.css` sets each platform's math font, because some
browsers, such as Electron, leave the generic `math` font family unset. To load KaTeX
only when needed, check `code.includes('$$')` before importing it; the Inkdrop plugin's
`use-math.ts` does this with React's `use()`.

## Also exported

`useMermaidRendering`, `useZoomControls`, `MermaidToolbar`, `DEFAULT_THEME_SWAP_DELAY_MS`,
and the toolbar icons — for hosts that want to compose their own layout instead of using
`MermaidDiagram`.

## A note on Pele versions

`styles.css` themes Pele's markup: its class names and the private `--_*` variables in
its attributes, which can change in any release. After bumping `pele`, run
`pnpm --filter @inkdropapp/mermaid check:styles` (and again with `--webkit`). It renders
every diagram type in light, dark and print, and fails when a token or rule no longer
takes effect.

## License

MIT
