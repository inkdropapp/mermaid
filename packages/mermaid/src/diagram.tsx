import React from 'react'

import { useMermaidRendering, type UseMermaidRenderingOptions } from './render'
import { MermaidToolbar, type MermaidButtonProps } from './toolbar'
import { useZoomControls } from './zoom-controls'

export type { MermaidButtonProps }

export interface MermaidDiagramProps extends Pick<
  UseMermaidRenderingOptions,
  'themeRevision' | 'themeSwapDelayMs'
> {
  /** The diagram source (the body of a ```mermaid fenced block). */
  code: string
  /**
   * The host's button component, used for the toolbar controls. Inkdrop:
   * `components.getComponentClass('Button')`; web: `@inkdropapp/uikit`'s
   * `UIButton`. Without one the toolbar renders nothing.
   */
  Button?: React.ComponentType<MermaidButtonProps>
  /**
   * Whether the diagram is being rendered for print/export. Read from the
   * host's own `MarkdownRendererContext` — this package never imports it, so
   * that a bundled second copy of the context can't silently report `false`.
   */
  printMode?: boolean
  /** Show the hover toolbar. Ignored in print mode. */
  toolbar?: boolean
  /**
   * Enable Ctrl/Cmd + scroll and pinch zoom, and drag-to-pan while zoomed in.
   * Ignored in print mode.
   */
  panZoom?: boolean
  /**
   * Size the diagram to its container instead of its natural size, and keep the
   * toolbar visible rather than hover-gated. For full-screen / lightbox shells.
   */
  fill?: boolean
  /** When set, the toolbar shows an expand button that calls this. */
  onExpand?: () => void
}

/**
 * A Mermaid diagram rendered by Pele, with optional pan/zoom and a hover toolbar.
 *
 * Host-agnostic by construction: every host-specific value (the button
 * component, print mode, the theme signal) arrives as a prop, so the same
 * component serves the Inkdrop plugin, the website demo, and the mobile web
 * editor. See {@link MermaidDiagramProps}.
 *
 * Colours come from the `--mermaid-*` custom properties in
 * `@inkdropapp/css/mermaid.css`, mapped onto Pele's `--pele-*` variables by this
 * package's stylesheet. They are live: a theme switch recolours a drawn diagram
 * without re-rendering it. Without the token sheet, Pele's own palette applies.
 */
export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  Button,
  printMode = false,
  toolbar = true,
  panZoom = true,
  fill = false,
  onExpand,
  themeRevision,
  themeSwapDelayMs
}) => {
  const { error, containerRef, getZoom, zoomable } = useMermaidRendering(code, {
    printMode,
    panZoom,
    fill,
    themeRevision,
    themeSwapDelayMs
  })
  const controls = useZoomControls(getZoom)

  const className = [
    'mermaid-diagram',
    fill && 'mermaid-diagram-fill',
    printMode && 'mermaid-diagram-print'
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <div className="mermaid-diagram-content">
        <div className={printMode ? undefined : 'mermaid-dot-grid'} ref={containerRef} />
      </div>
      {toolbar && !printMode && (
        <MermaidToolbar
          error={error}
          // Inline, a diagram that already fits isn't zoomable; full screen is.
          panZoom={panZoom && zoomable}
          controls={controls}
          Button={Button}
          onExpand={onExpand}
        />
      )}
    </div>
  )
}

MermaidDiagram.displayName = 'MermaidDiagram'
