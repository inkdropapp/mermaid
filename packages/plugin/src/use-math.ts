import type { MathResolver } from 'pele'
import { use } from 'react'

let loading: Promise<MathResolver> | undefined
let loaded: MathResolver | undefined

/**
 * The resolver for `$$...$$` labels. KaTeX is loaded the first time a diagram
 * contains math, suspending that diagram until it arrives; diagrams without
 * math never load it.
 */
export const useMath = (code: string): MathResolver | undefined => {
  if (loaded || !code.includes('$$')) return loaded
  loading ??= import('./math').then(m => (loaded = m.math))
  return use(loading)
}
