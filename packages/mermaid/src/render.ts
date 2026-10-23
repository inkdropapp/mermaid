import {
  mount,
  type MathResolver,
  type Mounted,
  type MountOptions,
  type RenderResult,
  type Zoom,
  type ZoomOptions
} from 'pele'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { RENDER_OPTIONS } from './render-options'

/** Default wait for a newly-selected theme's stylesheet to swap in. */
export const DEFAULT_THEME_SWAP_DELAY_MS = 400

/**
 * Pele's zoom with its own buttons off (the toolbar drives it), and in `fill`
 * able to enlarge any diagram. Module-level, because Pele rebuilds the zoom
 * whenever `MountOptions.zoom` changes identity.
 */
const INLINE_ZOOM_OPTIONS: ZoomOptions = { controls: false }
const FILL_ZOOM_OPTIONS: ZoomOptions = { always: true, controls: false }

/**
 * Pele's own test for a diagram it shrank to fit. Inline, only those are
 * zoomable: a zoomable diagram is a tab stop, takes double-clicks, and sets
 * `touch-action: pan-y`, which blocks page pinch-zoom over it on mobile.
 */
const FIT_EPSILON = 0.999

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error('Unknown error', { cause: err })

/**
 * Size the SVG to the largest box that fits the container in both axes, for
 * the `fill` variant. Pele only fits a diagram to its container's width, so a
 * tall diagram would otherwise run off the bottom of a full-screen shell.
 */
const fitToContainer = (container: HTMLElement, { width, height }: RenderResult) => {
  const svg = container.querySelector<SVGSVGElement>(':scope > svg')
  const { clientWidth, clientHeight } = container
  if (!svg || !width || !height || !clientWidth || !clientHeight) return
  svg.style.width = `${Math.min(clientWidth, (clientHeight * width) / height)}px`
  svg.style.maxWidth = 'none'
}

/**
 * Move and scale the container's background (the host's dot grid) with the
 * drawing. Pele pans and zooms by rewriting the SVG's viewBox, so the
 * container itself never moves; this anchors the grid to the diagram's origin.
 */
const syncBackground = (container: HTMLElement, zoom: Zoom) => {
  // Where the diagram's origin lands on screen, after the viewBox mapping.
  const origin = container.querySelector<SVGSVGElement>(':scope > svg')?.getScreenCTM()
  if (!origin) return
  const box = container.getBoundingClientRect()
  container.style.setProperty('--dot-grid-scale', String(zoom.scale / zoom.fit))
  container.style.setProperty('--dot-grid-x', `${origin.e - box.left}px`)
  container.style.setProperty('--dot-grid-y', `${origin.f - box.top}px`)
}

const GRID_PROPERTIES = ['--dot-grid-scale', '--dot-grid-x', '--dot-grid-y']

export interface UseMermaidRenderingOptions {
  /**
   * Whether the diagram is being rendered for print/export. Pan/zoom is off;
   * the light colours come from `color-scheme: light` on the diagram root
   * (see `MermaidDiagram`), not from anything done here.
   */
  printMode?: boolean
  /** Enable Ctrl/Cmd + scroll and pinch zoom, and drag-to-pan while zoomed. */
  panZoom?: boolean
  /** Size the diagram to fit its container in both axes. */
  fill?: boolean
  /**
   * Changes whenever the host's theme changes. Colours follow the theme on
   * their own (they are CSS variables), but a theme can also change the font
   * labels were measured in — a new value here re-measures them.
   */
  themeRevision?: string | number
  /**
   * How long to wait after `themeRevision` changes before re-measuring, so the
   * newly-selected theme's stylesheet has swapped in. Set `0` for hosts that
   * swap synchronously.
   */
  themeSwapDelayMs?: number
  /**
   * Typesets `$$...$$` in labels; without it they show the TeX source. Keep it
   * stable (module-level): a new function re-renders the diagram. See
   * `createKatexMath`.
   */
  math?: MathResolver
}

/**
 * Render `code` into a container with Pele, re-rendering when the code or the
 * options change and re-fitting when the container is resized.
 *
 * One `Mounted` lives per container: `mount()` once, then `update()` for new
 * code. Pele shows a diagram error in place — over the last good drawing while
 * editing — so the error returned here is only for hiding the toolbar.
 *
 * @returns The render error (if any), the container ref to attach, a getter
 *   for the live Pele zoom (absent while pan/zoom is off), and whether the
 *   drawn diagram can be zoomed at all.
 */
export const useMermaidRendering = (
  code: string,
  {
    printMode = false,
    panZoom = true,
    fill = false,
    themeRevision,
    themeSwapDelayMs = DEFAULT_THEME_SWAP_DELAY_MS,
    math
  }: UseMermaidRenderingOptions = {}
) => {
  const [error, setError] = useState<Error | null>(null)
  const [zoomable, setZoomable] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef<Mounted | null>(null)
  const renderedRevisionRef = useRef(themeRevision)
  // The zoom the user chose in `fill` mode, which Pele resets on every resize.
  const zoomRatioRef = useRef(1)

  /**
   * After the SVG or the container changed size: re-fit a `fill` diagram and
   * reapply the user's zoom, then recompute whether the diagram is zoomable.
   */
  const relayout = useCallback(
    (result = mountedRef.current?.result) => {
      const container = containerRef.current
      const zoom = mountedRef.current?.zoom
      if (fill && container && result) {
        fitToContainer(container, result)
        // The zoom measured the SVG before it was fitted. (On the very first
        // render it doesn't exist yet and measures the fitted size itself.)
        if (zoom) {
          zoom.refresh()
          if (zoomRatioRef.current > 1) zoom.zoomTo(zoomRatioRef.current * zoom.fit)
        }
      }
      if (container && zoom) syncBackground(container, zoom)
      setZoomable(!!zoom && (fill || zoom.fit < FIT_EPSILON))
    },
    [fill]
  )

  const zoomEnabled = panZoom && !printMode
  const options = useMemo<MountOptions>(
    () => ({
      ...RENDER_OPTIONS,
      math,
      zoom: zoomEnabled ? (fill ? FILL_ZOOM_OPTIONS : INLINE_ZOOM_OPTIONS) : false,
      onRender: result => {
        relayout(result)
        setError(null)
      },
      onError: err => setError(toError(err))
    }),
    [zoomEnabled, fill, math, relayout]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!code) {
      mountedRef.current?.destroy()
      mountedRef.current = null
      container.replaceChildren()
      return
    }
    // Diagram errors arrive through onError, but Pele rethrows one that comes
    // after it swapped the SVG in (an exception in onRender, say). Show it
    // like any other rather than letting it unmount the host's tree.
    try {
      if (mountedRef.current) mountedRef.current.update(code, options)
      else mountedRef.current = mount(container, code, options)
    } catch (err) {
      // The error comes from Pele, an external system, as onError's do.
      // oxlint-disable-next-line react/set-state-in-effect
      setError(toError(err))
    }
  }, [code, options])

  useEffect(
    () => () => {
      mountedRef.current?.destroy()
      mountedRef.current = null
    },
    []
  )

  // Pele re-lays-out for width changes, but `fill` also has to follow height,
  // and a diagram that fits at one width may need shrinking at another.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !(zoomEnabled || fill)) return
    const sizeOf = () => container.clientWidth + container.clientHeight
    let size = sizeOf()
    const resizes = new ResizeObserver(() => {
      size = sizeOf()
      relayout()
    })
    resizes.observe(container)

    // Pele has no zoom event, but zooms by rewriting the SVG's viewBox. On each
    // rewrite, move the background along, and in `fill` record the user's zoom
    // unless a resize caused it: Pele's own observers reset the zoom on a
    // resize before ours (created later) runs.
    const zooms = zoomEnabled
      ? new MutationObserver(() => {
          const zoom = mountedRef.current?.zoom
          if (!zoom) return
          if (fill && sizeOf() === size) zoomRatioRef.current = zoom.scale / zoom.fit
          syncBackground(container, zoom)
        })
      : undefined
    zooms?.observe(container, { subtree: true, attributeFilter: ['viewBox'] })
    return () => {
      resizes.disconnect()
      zooms?.disconnect()
      for (const property of GRID_PROPERTIES) container.style.removeProperty(property)
    }
  }, [zoomEnabled, fill, relayout])

  useEffect(() => {
    if (renderedRevisionRef.current === themeRevision) return
    const timer = setTimeout(() => {
      renderedRevisionRef.current = themeRevision
      mountedRef.current?.refresh()
    }, themeSwapDelayMs)
    return () => clearTimeout(timer)
  }, [themeRevision, themeSwapDelayMs])

  const getZoom = useCallback((): Zoom | undefined => mountedRef.current?.zoom, [])

  // Clearing the code leaves the last error in state; it no longer applies.
  return { error: code ? error : null, containerRef, getZoom, zoomable }
}
