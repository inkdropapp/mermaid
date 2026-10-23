import type { Zoom } from 'pele'
import { useMemo } from 'react'

/** Zoom factor of one toolbar press. */
const ZOOM_STEP = 1.4

export interface ZoomControls {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

/**
 * Toolbar actions over a Pele zoom. The zoom is read through `getZoom` on each
 * press because Pele rebuilds it whenever the zoom option changes; zooming out
 * stops at the fitted size, which is the same as a reset.
 */
export const useZoomControls = (getZoom: () => Zoom | undefined): ZoomControls =>
  useMemo(
    () => ({
      zoomIn: () => getZoom()?.zoomBy(ZOOM_STEP),
      zoomOut: () => getZoom()?.zoomBy(1 / ZOOM_STEP),
      reset: () => getZoom()?.reset()
    }),
    [getZoom]
  )
