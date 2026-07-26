# Mermaid plugin for Inkdrop

A plugin for drawing flowcharts and diagrams using [mermaid.js](https://mermaid.js.org/) in Markdown code blocks.

## Install

Check out [the docs](https://docs.inkdrop.app/manual/extend-inkdrop-with-plugins) on how to install plugins.

### Command-line

```shell
ipm install mermaid
```

## Usage

    ```mermaid
    graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;
    ```

It will be rendered as:

![Flowchart example](https://github.com/inkdropapp/inkdrop-mermaid/raw/master/docs/images/example-01.png)

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

It will be rendered as:

![Sequence diagram example](https://github.com/inkdropapp/inkdrop-mermaid/raw/master/docs/images/example-02.png)

## Interacting with diagrams

Rendered diagrams are interactive:

- **Drag** to pan.
- **Ctrl/Cmd + scroll** to zoom in and out (a plain scroll still scrolls the note).
- **Ctrl/Cmd + drag** to select text in the diagram instead of panning.

Hover a diagram to reveal a floating toolbar in the bottom-right corner with zoom
in / out / reset controls and a button to open the diagram **full-screen**. A subtle
dot-grid backdrop tracks the diagram as you pan and zoom.

Both pan & zoom and the toolbar are enabled by default and can be toggled in
[Preferences](#preferences).

## Theming

Diagrams automatically match your active Inkdrop theme. Their colors are derived from
the theme's `--mermaid-*` CSS variables and re-resolved on every render, so switching
between light and dark — or any custom theme — restyles every diagram to fit. No
configuration required.

Exports and prints render in light mode, so diagrams stay legible on white paper.

### Per-diagram overrides

To override the theme for a single diagram, use Mermaid's `%%{init}%%` directive:

    ```mermaid
    %%{init:{
      'theme':'base',
      'themeVariables': {
        'primaryColor':'#6A7FAB',
        'primaryTextColor':'#FAFBF9',
        'primaryBorderColor':'#6A7FAB',
        'lineColor':'#6A7FABCC',
        'textColor':'#6A7FABCC',
        'fontSize':'16px'
      }
    }}%%

    graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;
    ```

It yields:

![Inline theming example](https://github.com/inkdropapp/inkdrop-mermaid/raw/master/docs/images/example-03.png)

More details can be found in [the Mermaid documentation](https://mermaid.js.org/config/theming.html).

## Preferences

Configure the plugin in Preferences → Plugins → mermaid:

| Option         | Default | Description                                                       |
| -------------- | ------- | ----------------------------------------------------------------- |
| **Pan & Zoom** | On      | Drag to pan and Ctrl/Cmd + scroll to zoom rendered diagrams.      |
| **Toolbar**    | On      | Show a hover toolbar with zoom controls and a full-screen button. |

## Changelog

See the [Releases](https://github.com/inkdropapp/inkdrop-mermaid/releases) page for the changelog.
