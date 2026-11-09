import type { RenderResult } from 'pele'

/**
 * Size the SVG to the largest box that fits the container in both axes, for
 * the `fill` variant. Pele only fits a diagram to its container's width, so a
 * tall diagram would otherwise run off the bottom of a full-screen shell. The
 * box is the container's content box: its padding (`--dot-grid-padding`)
 * is the margin around the drawing, which Pele's zoom draws over.
 *
 * Self-contained (no imports at runtime): `pnpm check:styles` injects it into
 * its test page as is.
 */
export const fitToContainer = (container: HTMLElement, { width, height }: RenderResult) => {
  const svg = container.querySelector<SVGSVGElement>(':scope > svg')
  const style = getComputedStyle(container)
  // A detached element computes empty padding, which would parse to NaN.
  const px = (value: string) => parseFloat(value) || 0
  const boxWidth = container.clientWidth - px(style.paddingLeft) - px(style.paddingRight)
  const boxHeight = container.clientHeight - px(style.paddingTop) - px(style.paddingBottom)
  if (!svg || !width || !height || boxWidth <= 0 || boxHeight <= 0) return
  svg.style.width = `${Math.min(boxWidth, (boxHeight * width) / height)}px`
  svg.style.maxWidth = 'none'
}
