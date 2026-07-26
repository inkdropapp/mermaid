import type { ConfigSchema, Environment, IInkdropPlugin } from '@inkdropapp/types'
import { lazy } from 'react'

import { setEnv } from './env'
import { MermaidFullscreen } from './mermaid-fullscreen'

const Mermaid = lazy(() => import('./mermaid'))

class InkdropPlugin implements IInkdropPlugin {
  config: Record<string, ConfigSchema> = {
    panZoom: {
      title: 'Pan & Zoom',
      type: 'boolean',
      description: 'Drag to pan and Ctrl/Cmd + scroll to zoom rendered diagrams',
      default: true
    },
    toolbar: {
      title: 'Toolbar',
      type: 'boolean',
      description: 'Show a hover toolbar with the diagram type and zoom controls',
      default: true
    }
  }

  activate(env: Environment) {
    const app = env?.appVersion ? env : inkdrop // backward compatibility for v5
    setEnv(app)
    if (app.markdownRenderer) {
      app.markdownRenderer.remarkCodeComponents.mermaid = Mermaid
    }
    app.components.registerClass(MermaidFullscreen, 'MermaidFullscreen')
    app.layouts.addComponentToLayout('modal', 'MermaidFullscreen')
  }

  deactivate(env: Environment) {
    const app = env?.appVersion ? env : inkdrop // backward compatibility for v5
    if (app.markdownRenderer) {
      app.markdownRenderer.remarkCodeComponents.mermaid = null
    }
    app.layouts.removeComponentFromLayout('modal', 'MermaidFullscreen')
    app.components.deleteClass(MermaidFullscreen, 'MermaidFullscreen')
    setEnv(undefined)
  }
}

export default new InkdropPlugin()
