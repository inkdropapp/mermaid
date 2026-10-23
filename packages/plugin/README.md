# Mermaid plugin for Inkdrop

A plugin for drawing flowcharts and diagrams with [Mermaid](https://mermaid.js.org/) syntax in Markdown code blocks. Diagrams are drawn by [Pele](https://pele.run/), a fast, small engine for Mermaid syntax, and follow your Inkdrop theme.

![Mermaid diagrams in Inkdrop](https://github.com/inkdropapp/mermaid/raw/master/docs/images/example-01.png)

## Install

Check out [the docs](https://docs.inkdrop.app/manual/extend-inkdrop-with-plugins) on how to install plugins.

### Command-line

```shell
ipm install mermaid
```

## Usage

Write a diagram in a `mermaid` code block:

    ```mermaid
    graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;
    ```

    ```mermaid
    sequenceDiagram
        participant Alice
        participant Bob
        Alice->>John: Hello John, how are you?
        loop Healthcheck
            John->>John: Fight against hypochondria
        end
        Note right of John: Rational thoughts <br/>prevail...
        John-->>Alice: Great!
        John->>Bob: How about you?
        Bob-->>John: Jolly gooda!
    ```

Pele targets Mermaid 12.1 syntax and supports its diagram types, with its own layout and visual style, so diagrams look somewhat different from Mermaid's. While you edit, a syntax error is shown in place over the last good drawing.

### Math

Wrap TeX in `$$...$$` inside a label. Quote the label so its brackets and braces are kept:

    ```mermaid
    flowchart LR
      A["$$x^2 + \frac{a}{b}$$"] --> B["Sum $$\sum_{i=1}^{n} i$$ done"]
      B --> C["$$\int_0^1 f(x)\,dx$$"]
    ```

Math is typeset with [KaTeX](https://katex.org/), which is loaded only when a diagram contains `$$`. It works in flowchart, sequence, state, class, ER, mindmap, kanban, block, requirement and use case diagrams.

## Interacting with diagrams

When a diagram is too wide for the note, it is shrunk to fit, and you can zoom into it:

- **Ctrl/Cmd + scroll** or **pinch** to zoom in and out. A plain scroll still scrolls the note.
- **Drag** to pan while zoomed in.
- **Double-click** to zoom in, and again to reset.
- With the diagram focused, **+** / **-** zoom, **0** or **Esc** resets, and the **arrow keys** pan.

Diagrams that already fit at their natural size aren't zoomable in the note, so they don't get in the way of scrolling or selecting text. Open any diagram **full-screen** to zoom into it.

Hover a diagram to reveal a toolbar in the bottom-right corner with the full-screen button and, when the diagram is zoomable, zoom in / out / reset. In full screen, the diagram fits the window, keeps your zoom when the window resizes, and a dot grid moves with it as you pan and zoom.

Both zoom and the toolbar can be turned off in [Preferences](#preferences).

## Theming

Diagrams match your active Inkdrop theme with no configuration. Their colours come from the theme's `--mermaid-*` CSS variables and stay live: switching between light and dark, or to any custom theme, restyles every diagram without re-rendering it.

Exports and prints render in light mode, so diagrams stay legible on white paper.

### Per-diagram styling

To change the colours of individual nodes, use Mermaid's `classDef` and `style` statements:

    ```mermaid
    flowchart LR
      A[Hot] --> B[Cold]
      classDef hot fill:#f96,stroke:#333
      class A hot
      style B fill:#bbf
    ```

Mermaid's `%%{init}%%` theme variables are not supported.

## Preferences

Configure the plugin in Preferences → Plugins → mermaid:

| Option         | Default | Description                                                                         |
| -------------- | ------- | ----------------------------------------------------------------------------------- |
| **Pan & Zoom** | On      | Ctrl/Cmd + scroll or pinch to zoom rendered diagrams, and drag to pan while zoomed. |
| **Toolbar**    | On      | Show a hover toolbar with zoom controls and a full-screen button.                   |

## Known issues

- Text can't be selected while a diagram is zoomed in.
- While dragging a zoomed diagram, the cursor shows an arrow instead of a closed hand.

## Changelog

See the [Releases](https://github.com/inkdropapp/mermaid/releases) page for the changelog.
