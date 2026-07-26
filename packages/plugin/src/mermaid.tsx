import { MermaidDiagram } from '@inkdropapp/mermaid'
import type { ButtonProps, CodeComponentProps } from '@inkdropapp/types'
import { useLocalConfigValue } from 'inkdrop'
import React, { useContext, useMemo } from 'react'

import { getEnv } from './env'
import type { MermaidCommands } from './mermaid-fullscreen'
import { useConfig } from './use-config'

/**
 * Inkdrop adapter around `<MermaidDiagram>`: everything host-specific is read
 * here — the Button component, the plugin's settings, `printMode` from the
 * app's markdown renderer context, and the active theme — and handed down as
 * props. The package itself touches no Inkdrop API.
 */
const Mermaid: React.FC<CodeComponentProps> = ({ children }) => {
  const { markdownRenderer, commands, components } = getEnv()

  const code = useMemo(() => {
    if (typeof children === 'string') return children
    if (Array.isArray(children) && typeof children[0] === 'string') return children[0]
    return ''
  }, [children])

  const { toolbar, panZoom } = useConfig()
  const { printMode } = useContext(markdownRenderer.Context)
  // Diagram colours are baked in at render time, so a theme switch needs an
  // explicit re-render; this is the same keyPath the app's theme manager watches.
  const theme = useLocalConfigValue<string>('core.theme')

  // Dispatched on `document.body`, which is where MermaidFullscreen registers
  // the command.
  const openFullscreen = () =>
    commands.dispatch<MermaidCommands>(document.body, 'mermaid:open-fullscreen', { code, panZoom })

  return (
    <MermaidDiagram
      code={code}
      Button={components.getComponentClass<ButtonProps>('Button')}
      printMode={printMode}
      toolbar={toolbar}
      panZoom={panZoom}
      themeRevision={theme}
      onExpand={openFullscreen}
    />
  )
}

Mermaid.displayName = 'Mermaid'

export default Mermaid
