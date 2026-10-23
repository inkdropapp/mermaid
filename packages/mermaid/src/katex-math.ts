import type { MathMarkup, MathResolver } from 'pele'

/** The part of KaTeX this needs, so the package doesn't depend on it. */
export interface KatexLike {
  renderToString(
    tex: string,
    options: { output: 'mathml'; displayMode: boolean; throwOnError: boolean }
  ): string
}

/**
 * A Pele `math` resolver that typesets `$$...$$` labels with the host's KaTeX.
 *
 * KaTeX emits MathML only, which the browser lays out with no stylesheet or
 * fonts, as Mermaid does where MathML is supported. Pele needs each formula's
 * size up front, so it is measured once in a hidden element, styled like the
 * box Pele puts it in. styles/mermaid.css picks the math font for both.
 */
export const createKatexMath = (katex: KatexLike): MathResolver => {
  const cache = new Map<string, MathMarkup>()
  let probe: HTMLDivElement | undefined
  return (tex, size) => {
    const key = `${size}\n${tex}`
    const cached = cache.get(key)
    if (cached) return cached
    if (typeof document === 'undefined') return undefined
    const html = katex.renderToString(tex, {
      output: 'mathml',
      displayMode: true,
      throwOnError: false
    })
    if (!probe) {
      probe = document.createElement('div')
      probe.className = 'mermaid-math-probe'
      probe.style.cssText =
        'position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none;line-height:normal;white-space:nowrap'
    }
    probe.style.fontSize = `${size}px`
    probe.innerHTML = html
    document.body.append(probe)
    const { width, height } = probe.getBoundingClientRect()
    probe.remove()
    const markup = { html, width: Math.ceil(width), height: Math.ceil(height) }
    cache.set(key, markup)
    return markup
  }
}
