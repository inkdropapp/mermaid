import React from 'react'

import { ExpandIcon, ResetIcon, ZoomInIcon, ZoomOutIcon } from './icons'
import type { PanZoomControls } from './use-panzoom'

/**
 * The structural shape the toolbar needs from a host's button component.
 * Satisfied by Inkdrop's `Button` (via `components.getComponentClass`) and by
 * `@inkdropapp/uikit`'s `UIButton`.
 *
 * These prop types must match the host components' *exactly*, not merely be
 * narrower: `ComponentClass.defaultProps` is `Partial<P>`, which makes `P`
 * covariant as well as contravariant. Narrowing `tooltip` to `string` or
 * `onClick` to `() => void` makes a host's button unassignable.
 */
export interface MermaidButtonProps {
  bare?: boolean
  tooltip?: React.ReactNode
  'aria-label'?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  children?: React.ReactNode
}

export interface MermaidToolbarProps {
  /** Set when rendering failed; the controls are hidden (nothing to operate). */
  error: Error | null
  /** Resolved `panZoom` flag; the zoom buttons render only when it is on. */
  panZoom: boolean
  /** Imperative zoom controls from `usePanZoom`. */
  controls: PanZoomControls
  /** The host's button component; without one the toolbar renders nothing. */
  Button?: React.ComponentType<MermaidButtonProps>
  /** When set, show an Expand button that opens the host's full-screen view. */
  onExpand?: () => void
}

/**
 * Floating controls overlaid on a rendered diagram, hidden until the diagram is
 * hovered (the fade-in lives in styles/mermaid.css).
 *
 * It renders as a sibling of `.mermaid-diagram-content` (the pan/zoom owner) —
 * never inside it — so panzoom, which binds its gesture listeners on that
 * content wrapper, never receives the toolbar's pointer events. The buttons come
 * from the host (see {@link MermaidButtonProps}) and are rendered `bare` so the
 * dark-pill styling applies instead of a default button look.
 *
 * The zoom buttons appear only when pan/zoom is enabled; `onExpand` adds an
 * expand button. Renders nothing without a `Button`, on error, or when there is
 * no button to show.
 */
export const MermaidToolbar: React.FC<MermaidToolbarProps> = ({
  error,
  panZoom,
  controls,
  Button,
  onExpand
}) => {
  if (error || !Button) return null
  if (!panZoom && !onExpand) return null

  return (
    <div className="mermaid-toolbar">
      <div className="mermaid-toolbar-controls">
        {panZoom && (
          <>
            <Button bare aria-label="Zoom in" tooltip="Zoom in" onClick={controls.zoomIn}>
              <ZoomInIcon />
            </Button>
            <Button bare aria-label="Reset zoom" tooltip="Reset zoom" onClick={controls.reset}>
              <ResetIcon />
            </Button>
            <Button bare aria-label="Zoom out" tooltip="Zoom out" onClick={controls.zoomOut}>
              <ZoomOutIcon />
            </Button>
          </>
        )}
        {onExpand && (
          <Button bare aria-label="Full screen" tooltip="Full screen" onClick={onExpand}>
            <ExpandIcon />
          </Button>
        )}
      </div>
    </div>
  )
}

MermaidToolbar.displayName = 'MermaidToolbar'
