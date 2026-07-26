import type { Environment } from '@inkdropapp/types'

/**
 * Captures the `Environment` instance handed to `activate()` so the plugin's
 * other modules can reach it without touching the (discouraged) global
 * `inkdrop` variable.
 */
let captured: Environment | undefined

export function setEnv(env: Environment | undefined): void {
  captured = env
}

export function getEnv(): Environment {
  if (!captured) {
    throw new Error('inkdrop-mermaid: env accessed before activate()')
  }
  return captured
}
