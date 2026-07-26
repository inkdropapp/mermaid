import React, { useMemo } from 'react'

import { useMermaidRendering, type UseMermaidRenderingOptions } from './render'
import { MermaidToolbar, type MermaidButtonProps } from './toolbar'
import { usePanZoom } from './use-panzoom'

export type { MermaidButtonProps }

export interface MermaidDiagramProps extends UseMermaidRenderingOptions {
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
  /** Enable drag-to-pan and Ctrl/Cmd + scroll zoom. Ignored in print mode. */
  panZoom?: boolean
  /**
   * Size the diagram to its container instead of its natural size, and keep the
   * toolbar visible rather than hover-gated. For full-screen / lightbox shells.
   */
  fill?: boolean
  /** When set, the toolbar shows an expand button that calls this. */
  onExpand?: () => void
}

const useDiagramId = () =>
  useMemo(
    () =>
      `mermaid-${Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substring(0, 5)}`,
    []
  )

/**
 * A rendered Mermaid diagram with optional pan/zoom and a hover toolbar.
 *
 * Host-agnostic by construction: every host-specific value (the button
 * component, print mode, the theme signal) arrives as a prop, so the same
 * component serves the Inkdrop plugin, the website demo, and the mobile web
 * editor. See {@link MermaidDiagramProps}.
 *
 * Requires the `--mermaid-*` custom properties from `@inkdropapp/css/mermaid.css`
 * to be loaded — they carry no fallbacks, so without that sheet the diagram
 * renders unpainted.
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
  const id = useDiagramId()
  const { error, containerRef, renderNonce } = useMermaidRendering(id, code, printMode, {
    themeRevision,
    themeSwapDelayMs
  })
  const controls = usePanZoom(containerRef, renderNonce, panZoom && !printMode)

  const className = fill ? 'mermaid-diagram mermaid-diagram-fill' : 'mermaid-diagram'

  return (
    <div className={className}>
      <div className="mermaid-diagram-content">
        <div className={printMode ? '' : 'mermaid-dot-grid'} ref={containerRef} />
      </div>
      {toolbar && !printMode && (
        <MermaidToolbar
          error={error}
          panZoom={panZoom}
          controls={controls}
          Button={Button}
          onExpand={onExpand}
        />
      )}
      {error && (
        <div className="ui error message">
          <div className="header">Failed to render Mermaid</div>
          <div>
            <pre>{error.message}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

MermaidDiagram.displayName = 'MermaidDiagram'
