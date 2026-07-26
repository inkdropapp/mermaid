import { useState, useEffect } from 'react'

import { getEnv } from './env'

/** Live values of the plugin's `mermaid.toolbar` / `mermaid.panZoom` settings. */
export const useConfig = () => {
  const { config } = getEnv()

  const [toolbar, setToolbar] = useState<boolean>(config.get('mermaid.toolbar'))
  const [panZoom, setPanZoom] = useState<boolean>(config.get('mermaid.panZoom'))

  useEffect(() => {
    const toolbarObserver = config.observe('mermaid.toolbar', setToolbar)
    const panZoomObserver = config.observe('mermaid.panZoom', setPanZoom)
    return () => {
      toolbarObserver.dispose()
      panZoomObserver.dispose()
    }
  }, [config])

  return { toolbar, panZoom }
}
