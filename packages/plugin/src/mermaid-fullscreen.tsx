import type { ButtonProps, ModalProps } from '@inkdropapp/types'
import { useLocalConfigValue } from 'inkdrop'
import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react'

import { getEnv } from './env'

/** Payload of the command that opens the full-screen viewer. */
export interface OpenFullscreenDetail {
  code: string
  panZoom: boolean
}

export type MermaidCommands = {
  'mermaid:open-fullscreen': OpenFullscreenDetail
}

// Lazy-loaded so `mermaid` (pulled in transitively by @inkdropapp/mermaid)
// stays out of the eager entry bundle — this host is registered at activate()
// and must import nothing heavy.
const MermaidDiagram = lazy(() =>
  import('@inkdropapp/mermaid').then(m => ({ default: m.MermaidDiagram }))
)

/**
 * Top-level singleton full-screen viewer, registered into the `modal` layout in
 * index.ts. Mounting it at that top-level region (rather than deep in the note
 * preview) is what lets Inkdrop's `Modal` — which positions its overlay
 * `absolute`ly over the window — cover the screen without a React portal.
 *
 * It listens for the `mermaid:open-fullscreen` command, which a diagram's expand
 * button dispatches with that diagram's `code` / `panZoom`, and shows it in the
 * modal. Esc / backdrop / the close button dismiss it.
 */
export const MermaidFullscreen: React.FC = () => {
  const Modal = getEnv().components.getComponentClass<ModalProps>('Modal')!
  const Button = getEnv().components.getComponentClass<ButtonProps>('Button')!
  const [diagram, setDiagram] = useState<OpenFullscreenDetail | null>(null)
  const close = useCallback(() => setDiagram(null), [])
  const theme = useLocalConfigValue<string>('core.theme')

  useEffect(() => {
    const sub = getEnv().commands.add<MermaidCommands>(document.body, {
      'mermaid:open-fullscreen': {
        hiddenInCommandPalette: true,
        didDispatch: e => {
          if (e.detail) setDiagram(e.detail)
        }
      }
    })
    return () => sub.dispose()
  }, [])

  return (
    <Modal
      visible={!!diagram}
      autofocus
      className="mermaid-fullscreen"
      onBackdropClick={close}
      onEscKeyDown={close}
    >
      <div className="mermaid-fullscreen-stage">
        {diagram && (
          <Suspense fallback={null}>
            <MermaidDiagram
              code={diagram.code}
              panZoom={diagram.panZoom}
              Button={Button}
              themeRevision={theme}
              fill
            />
          </Suspense>
        )}
        <Button className="close-button" icon="close" tooltip="Close" onClick={close} />
      </div>
    </Modal>
  )
}

MermaidFullscreen.displayName = 'MermaidFullscreen'
