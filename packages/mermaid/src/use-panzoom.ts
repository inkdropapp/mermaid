import panzoom, { type PanZoom, type Transform } from 'panzoom'
import { type RefObject, useCallback, useEffect, useRef } from 'react'

const MIN_ZOOM = 0.2
const MAX_ZOOM = 8
const ZOOM_STEP = 1.4
const BOUNDS_PADDING = 0.15

export interface PanZoomControls {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

/** True once the element has real layout size — never pan/zoom a 0×0 node. */
const hasSize = (el: Element): boolean => {
  const { width, height } = el.getBoundingClientRect()
  return width > 0 && height > 0
}

/**
 * Attach a gesture pan/zoom for a rendered Mermaid diagram.
 *
 * @param containerRef - Div holding the injected Mermaid SVG (the pan/zoom scene).
 * @param renderNonce - Bumped by `useMermaidRendering` after each render.
 * @param enabled - Resolved `panZoom` flag; when false the hook is inert.
 * @returns Imperative `zoomIn` / `zoomOut` / `reset` controls for the toolbar.
 */
export const usePanZoom = (
  containerRef: RefObject<HTMLDivElement | null>,
  renderNonce: number,
  enabled: boolean
): PanZoomControls => {
  const instanceRef = useRef<PanZoom | null>(null)
  // The transform captured right after init (identity in DOM mode), restored by reset().
  const initialRef = useRef<Transform | null>(null)

  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container || !container.parentElement || !container.querySelector('svg')) return

    let observer: ResizeObserver | null = null
    let detachListeners: (() => void) | null = null

    const init = () => {
      if (instanceRef.current || !hasSize(container)) return
      const viewport = container.parentElement
      if (!viewport) return
      const instance = panzoom(container, {
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        bounds: true,
        boundsPadding: BOUNDS_PADDING,
        beforeWheel: e => !e.ctrlKey && !e.metaKey,
        // Ctrl/Cmd + mouse-down selects diagram text instead of panning.
        beforeMouseDown: e => e.ctrlKey || e.metaKey,
        // Plain double-click zooms in by the same step as the toolbar buttons.
        zoomDoubleClickSpeed: ZOOM_STEP
      })
      instanceRef.current = instance
      const { x, y, scale } = instance.getTransform()
      initialRef.current = { x, y, scale }

      // The cursor mirrors what a gesture would do: open hand at rest, closed
      // hand while panning, and a text caret while Ctrl/Cmd is held — which
      // disables panning (see beforeMouseDown) to select the diagram's text.
      let panning = false
      let modifierHeld = false
      const applyCursor = () => {
        container.style.cursor = panning ? 'grabbing' : modifierHeld ? 'text' : 'grab'
      }
      applyCursor()

      instance.on('panstart', () => {
        panning = true
        applyCursor()
      })
      instance.on('panend', () => {
        panning = false
        applyCursor()
      })

      const syncModifier = (e: KeyboardEvent) => {
        const held = e.ctrlKey || e.metaKey
        if (held === modifierHeld) return
        modifierHeld = held
        applyCursor()
      }
      window.addEventListener('keydown', syncModifier)
      window.addEventListener('keyup', syncModifier)

      // Ctrl/Cmd + double-click zooms out (panzoom always zooms in). Intercept
      // in the capture phase so panzoom's own zoom-in never runs for it.
      const zoomOutOnModifiedDblClick = (e: MouseEvent) => {
        if (!e.ctrlKey && !e.metaKey) return
        e.stopImmediatePropagation()
        e.preventDefault()
        const { left, top } = viewport.getBoundingClientRect()
        instance.smoothZoom(e.clientX - left, e.clientY - top, 1 / ZOOM_STEP)
      }
      viewport.addEventListener('dblclick', zoomOutOnModifiedDblClick, true)

      detachListeners = () => {
        window.removeEventListener('keydown', syncModifier)
        window.removeEventListener('keyup', syncModifier)
        viewport.removeEventListener('dblclick', zoomOutOnModifiedDblClick, true)
      }

      observer?.disconnect()
      observer = null
    }

    // Init immediately if sized; otherwise a ResizeObserver catches the
    // container gaining size later (e.g. its pane leaving `display: none`) —
    // unlike IntersectionObserver, it fires on any real size change.
    init()
    if (!instanceRef.current) {
      observer = new ResizeObserver(() => init())
      observer.observe(container)
    }

    return () => {
      observer?.disconnect()
      detachListeners?.()
      instanceRef.current?.dispose()
      instanceRef.current = null
      initialRef.current = null
      // panzoom leaves its last CSS transform on the div; clear it so the next
      // render (which reuses this element) starts from the natural position.
      container.style.transform = ''
      container.style.transformOrigin = ''
      container.style.cursor = ''
    }
  }, [containerRef, renderNonce, enabled])

  /**
   * Runs `fn` only when a live instance is attached to a visible, sized
   * container. `viewport` is panzoom's owner (the container's parent); its
   * centre is the zoom anchor, so toolbar zoom keeps the view centred.
   */
  const run = useCallback(
    (fn: (instance: PanZoom, viewport: HTMLElement) => void) => {
      const instance = instanceRef.current
      const container = containerRef.current
      const viewport = container?.parentElement
      if (!instance || !container || !viewport || !hasSize(container)) return
      fn(instance, viewport)
    },
    [containerRef]
  )

  const zoomIn = useCallback(
    () =>
      run((instance, viewport) => {
        const { width, height } = viewport.getBoundingClientRect()
        instance.smoothZoom(width / 2, height / 2, ZOOM_STEP)
      }),
    [run]
  )

  const zoomOut = useCallback(
    () =>
      run((instance, viewport) => {
        const { width, height } = viewport.getBoundingClientRect()
        instance.smoothZoom(width / 2, height / 2, 1 / ZOOM_STEP)
      }),
    [run]
  )

  const reset = useCallback(
    () =>
      run(instance => {
        const initial = initialRef.current
        if (!initial) return
        // Restore the natural (identity) transform captured at init — no fit().
        instance.zoomAbs(0, 0, initial.scale)
        instance.moveTo(initial.x, initial.y)
      }),
    [run]
  )

  return { zoomIn, zoomOut, reset }
}
