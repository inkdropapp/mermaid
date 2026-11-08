import { useState, useEffect } from 'react'

import { getEnv } from './env'

/**
 * Live values of the plugin's `mermaid.toolbar` / `mermaid.panZoom` /
 * `mermaid.center` settings.
 */
export const useConfig = () => {
  const { config } = getEnv()

  const [toolbar, setToolbar] = useState<boolean>(config.get('mermaid.toolbar'))
  const [panZoom, setPanZoom] = useState<boolean>(config.get('mermaid.panZoom'))
  const [center, setCenter] = useState<boolean>(config.get('mermaid.center'))

  useEffect(() => {
    const observers = [
      config.observe('mermaid.toolbar', setToolbar),
      config.observe('mermaid.panZoom', setPanZoom),
      config.observe('mermaid.center', setCenter)
    ]
    return () => {
      for (const observer of observers) observer.dispose()
    }
  }, [config])

  return { toolbar, panZoom, center }
}
