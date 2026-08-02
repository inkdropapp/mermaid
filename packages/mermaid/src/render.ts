import mermaid, { RenderResult } from 'mermaid'
import { useState, useEffect, useRef } from 'react'

import { buildInkdropThemeVariables } from './theme'

/** Default wait for a newly-selected theme's stylesheet to swap in. */
export const DEFAULT_THEME_SWAP_DELAY_MS = 400

const srgbColorPattern = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/

/**
 * Serialize a browser-computed colour into a form khroma (Mermaid's colour
 * maths) can parse.
 *
 * `getComputedStyle().color` yields legacy `rgb()` / `rgba()` for most colours,
 * but modern engines serialize `color-mix()` / `color()` results as the CSS
 * Color 4 form `color(srgb r g b [/ a])`, which khroma rejects ("Unsupported
 * color format") — crashing the render. Convert that one form to `rgb()` /
 * `rgba()`; pass every already-legacy value through untouched.
 */
const toKhromaColor = (computedColor: string): string => {
  const match = srgbColorPattern.exec(computedColor)
  if (!match) return computedColor
  const [red, green, blue] = [match[1], match[2], match[3]].map(channel =>
    Math.round(Math.min(1, Math.max(0, Number(channel))) * 255)
  )
  return match[4] === undefined
    ? `rgb(${red}, ${green}, ${blue})`
    : `rgba(${red}, ${green}, ${blue}, ${match[4]})`
}

/**
 * Resolve Mermaid's `themeVariables` from the host's `--mermaid-*` CSS variables.
 *
 * We can't read the custom properties directly: their values are `light-dark()`
 * / nested `var()` expressions that only collapse to a colour when *used*. So we
 * assign each `var(--mermaid-<token>)` to a throwaway probe's `color` and read
 * the browser-computed colour back — exactly the colour the active theme paints,
 * light/dark included — normalising it via `toKhromaColor` so `color-mix()` /
 * `color()` results reach khroma as `rgb()`. Passing concrete colours (not
 * `var()`) is what lets Mermaid's `base` theme run them through khroma safely.
 *
 * Resolving per render means a diagram picks up the theme active when it renders.
 *
 * @param forceLightMode - Pin the probe to `color-scheme: light` so every
 *   `light-dark()` resolves to its light branch regardless of the host theme.
 *   Used for print/export, where diagrams should render for white paper.
 * @param themeHost - Element the probe mounts inside, so `--mermaid-*` resolve
 *   against every theme scope wrapping the *diagram* — a host can scope a
 *   theme's variables to a class partway down the tree (e.g. a themed landing
 *   section) and a diagram inside it follows that theme, not `:root`'s.
 */
const resolveInkdropThemeVariables = (forceLightMode: boolean, themeHost: HTMLElement) => {
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none'
  if (forceLightMode) probe.style.colorScheme = 'light'
  themeHost.appendChild(probe)
  try {
    return buildInkdropThemeVariables(token => {
      probe.style.color = `var(--mermaid-${token})`
      return toKhromaColor(getComputedStyle(probe).color)
    })
  } finally {
    probe.remove()
  }
}

/** Mermaid appends tooltip nodes to `<body>`, outliving the diagram's own DOM. */
const removeMermaidTooltips = () => {
  document.querySelectorAll('body > div.mermaidTooltip').forEach(el => el.remove())
}

const renderDiagram = async (
  id: string,
  code: string,
  printMode: boolean,
  themeHost: HTMLElement
): Promise<RenderResult> => {
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: 'base',
    themeVariables: resolveInkdropThemeVariables(printMode, themeHost)
  })
  try {
    return await mermaid.render(id, code)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Unknown error', { cause: err })
  }
}

export interface UseMermaidRenderingOptions {
  /**
   * Changes whenever the host's theme changes. Colours are resolved from CSS
   * and baked into the SVG at render time, so an already-rendered diagram
   * won't pick up a new theme on its own — a new value here forces a re-render.
   */
  themeRevision?: string | number
  /**
   * How long to wait after `themeRevision` changes before re-rendering, so the
   * newly-selected theme's stylesheet has swapped in before the probe
   * re-resolves `--mermaid-*`. Set `0` for hosts that swap synchronously.
   */
  themeSwapDelayMs?: number
}

/**
 * Render `code` into a container as an SVG diagram, re-rendering when the code,
 * the print mode, or the host's theme changes.
 *
 * @param id - Unique element id for the generated SVG; must be a valid CSS
 *   identifier, since it is used as a `querySelector` target.
 * @returns The render error (if any), the container ref to attach, and a
 *   `renderNonce` bumped after every successful render so downstream hooks
 *   (e.g. pan/zoom) can re-attach to the freshly injected SVG.
 */
export const useMermaidRendering = (
  id: string,
  code: string,
  printMode: boolean,
  { themeRevision, themeSwapDelayMs = DEFAULT_THEME_SWAP_DELAY_MS }: UseMermaidRenderingOptions = {}
) => {
  const [error, setError] = useState<Error | null>(null)
  // Bumped after every successful render so downstream hooks (e.g. pan/zoom)
  // can re-attach to the freshly injected SVG without diffing the DOM.
  const [renderNonce, setRenderNonce] = useState(0)
  // Bumped when the host theme changes, forcing a re-render: colours are
  // resolved from CSS and baked into the SVG at render time, so an
  // already-rendered diagram won't pick up a new theme on its own.
  const [themeGeneration, setThemeGeneration] = useState(0)
  const renderedRevisionRef = useRef(themeRevision)
  // Distinguishes each render's id from the one already on screen — see the
  // `renderId` note in the render effect.
  const renderCountRef = useRef(0)

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (renderedRevisionRef.current === themeRevision) return
    const timer = setTimeout(() => {
      renderedRevisionRef.current = themeRevision
      setThemeGeneration(generation => generation + 1)
    }, themeSwapDelayMs)
    return () => clearTimeout(timer)
  }, [themeRevision, themeSwapDelayMs])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!code) {
      container.innerHTML = ''
      removeMermaidTooltips()
      return
    }
    let cancelled = false

    const renderId = `${id}-${++renderCountRef.current}`

    renderDiagram(renderId, code, printMode, container)
      .then(({ svg, bindFunctions }) => {
        if (cancelled || !svg.length) return

        removeMermaidTooltips()
        container.innerHTML = svg
        const diagram = container.querySelector<SVGSVGElement>(`#${renderId}`)
        if (!diagram) return

        bindFunctions?.(container)
        setError(null)
        setRenderNonce(nonce => nonce + 1)
      })
      .catch(err => {
        if (!cancelled) setError(err)
      })

    return () => {
      cancelled = true
    }
  }, [id, code, printMode, themeGeneration])

  useEffect(() => removeMermaidTooltips, [])

  return { error, containerRef, renderNonce }
}
