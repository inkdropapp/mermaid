/**
 * Check that styles/mermaid.css still themes what Pele draws.
 *
 * The per-diagram rules lean on Pele's markup (class names and the private
 * `--_*` aliases in its attributes), which can change in any release. This
 * renders every fixture with the real `@inkdropapp/css` tokens in Chromium, in
 * light, dark and print, and fails when:
 *
 * - a diagram doesn't render,
 * - a `--mermaid-*` token in `@inkdropapp/css/mermaid.css` has no effect (not
 *   referenced here, directly or through a token that is) and isn't listed in
 *   UNUSED_TOKENS,
 * - a rule that applies a token matches nothing Pele drew, or
 * - such a rule matches but never wins (another declaration overrides it).
 *
 * Usage: pnpm check:styles [--webkit] [--out <dir>]
 *   --webkit  render in WebKit (the mobile app's engine) instead of Chromium
 *   --out     save a screenshot per diagram to <dir>/<mode>/<type>.png
 */
import { readFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, webkit } from 'playwright'

import { RENDER_OPTIONS } from '../src/render-options.ts'
import { fixtures } from './fixtures.mjs'

const require = createRequire(import.meta.url)
const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const cssDir = dirname(require.resolve('@inkdropapp/css/package.json'))

/** Tokens with nothing in Pele to apply them to, and why. */
const UNUSED_TOKENS = {
  'background-color': 'Pele draws no canvas; diagrams sit on the preview background.',
  'xychart-background-color': 'Pele draws no chart background.',
  'wardley-background-color': 'Pele draws no map background.',
  'composite-title-background-color':
    'Pele draws a divider, not a title band, on composite states.',
  'alt-background-color': 'Pele has no separate surface for concurrent state regions.',
  'task-text-light-color': "Pele doesn't tell a label on a light bar from one on a dark bar.",
  'task-text-dark-color': "Pele doesn't tell a label on a light bar from one on a dark bar.",
  'pie-outer-stroke-color': 'Pele draws no outer ring around a pie.'
}

/** Stylesheets from @inkdropapp/css that define the tokens and what they cascade from. */
const HOST_SHEETS = ['layers.css', 'tokens.css', 'ui.css', 'mermaid.css']

const MODES = [
  { name: 'light', scheme: 'light', print: false },
  { name: 'dark', scheme: 'dark', print: false },
  { name: 'print', scheme: 'dark', print: true }
]

const outIndex = process.argv.indexOf('--out')
const outDir = outIndex > 0 ? process.argv[outIndex + 1] : null

const tokenSheet = readFileSync(join(cssDir, 'mermaid.css'), 'utf8')
const ownSheet = readFileSync(join(packageDir, 'styles', 'mermaid.css'), 'utf8')

const failures = []

// --- Token coverage (static) -----------------------------------------------

const definitions = new Map(
  [...tokenSheet.matchAll(/--mermaid-([a-z0-9-]+):\s*([^;]+);/g)].map(m => [m[1], m[2]])
)
const references = text => [...text.matchAll(/var\(\s*--mermaid-([a-z0-9-]+)/g)].map(m => m[1])

// A token takes effect when a rule reads it, or when a token that takes effect
// cascades from it (e.g. --mermaid-label-color: var(--mermaid-node-text-color)).
// A Set's iteration visits entries added during it, so this walks the closure.
const effective = new Set(references(ownSheet))
for (const name of effective) {
  for (const source of references(definitions.get(name) ?? '')) effective.add(source)
}
for (const name of definitions.keys()) {
  if (!effective.has(name) && !(name in UNUSED_TOKENS)) {
    failures.push(`token --mermaid-${name} has no effect (apply it, or add it to UNUSED_TOKENS)`)
  }
}
for (const name of references(ownSheet)) {
  if (!definitions.has(name))
    failures.push(`styles/mermaid.css reads undefined token --mermaid-${name}`)
}
for (const name of Object.keys(UNUSED_TOKENS)) {
  if (effective.has(name))
    failures.push(`--mermaid-${name} is in UNUSED_TOKENS but does take effect`)
}

// --- Rendering (browser) ---------------------------------------------------

const hostCSS = HOST_SHEETS.map(name => readFileSync(join(cssDir, name), 'utf8')).join('\n')
const peleScript = readFileSync(require.resolve('pele/global'), 'utf8')

const engine = process.argv.includes('--webkit') ? webkit : chromium
const browser = await engine.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } })
  const pageErrors = []
  page.on('pageerror', err => pageErrors.push(err.message))

  await page.setContent(`<!doctype html><html><head>
    <style>${hostCSS}</style>
    <style id="own">${ownSheet}</style>
    <style>body { margin: 16px; background: var(--page-background); } .fixture { width: 900px; margin-bottom: 24px; }
      .fixture > h2 { font: 600 13px sans-serif; color: var(--text-color); margin: 0 0 4px; }</style>
  </head><body></body></html>`)
  await page.addScriptTag({ content: peleScript })

  // Each fixture renders the same way MermaidDiagram renders it.
  const modeResults = []
  for (const mode of MODES) {
    const errors = await page.evaluate(
      ({ fixtures, mode, renderOptions }) => {
        document.documentElement.style.colorScheme = mode.scheme
        document.body.style.colorScheme = mode.scheme
        // Print renders for white paper; the page under it stays dark-scheme.
        document.body.style.background = mode.print ? 'white' : ''
        document.body.replaceChildren()
        const errors = []
        for (const [type, code] of Object.entries(fixtures)) {
          const section = document.createElement('section')
          section.className = 'fixture'
          section.innerHTML = `<h2>${type}</h2><div class="mermaid-diagram${
            mode.print ? ' mermaid-diagram-print' : ''
          }"><div class="mermaid-diagram-content"><div></div></div></div>`
          document.body.append(section)
          window.pele.mount(section.querySelector('.mermaid-diagram-content > div'), code, {
            ...renderOptions,
            zoom: false,
            // Inside the Gantt fixture's range, so the today marker is drawn.
            now: new Date('2026-01-08T12:00:00'),
            onError: err => errors.push(`${type}: ${err?.message ?? err}`)
          })
        }
        for (const section of document.querySelectorAll('.fixture')) {
          if (!section.querySelector('svg.pele')) errors.push(`${section.textContent}: no SVG`)
        }
        return errors
      },
      { fixtures, mode, renderOptions: RENDER_OPTIONS }
    )
    for (const error of errors) failures.push(`[${mode.name}] render: ${error}`)

    // Which token rules match, and whether they win anywhere.
    const rules = await page.evaluate(() => {
      const own = document.getElementById('own').sheet
      const results = []
      const fullSelector = rule => {
        const parent = rule.parentRule
        if (!(parent instanceof CSSStyleRule)) return rule.selectorText
        const outer = `:is(${fullSelector(parent)})`
        return rule.selectorText.includes('&')
          ? rule.selectorText.replaceAll('&', outer)
          : rule.selectorText
              .split(',')
              .map(part => `${outer} ${part.trim()}`)
              .join(', ')
      }
      const visit = list => {
        for (const rule of list) {
          if (!(rule instanceof CSSStyleRule)) continue
          const selector = fullSelector(rule)
          const tokenDeclarations = [...rule.style]
            .map(property => [property, rule.style.getPropertyValue(property)])
            .filter(([, value]) => value.includes('var(--mermaid-'))
          if (tokenDeclarations.length) {
            const elements = [...document.querySelectorAll(selector)]
            const painted = tokenDeclarations.filter(([property]) => !property.startsWith('--'))
            // A declaration wins on an element when its value, computed there,
            // is what the element ends up with.
            const wins = painted.map(([property, value]) =>
              elements.some(element => {
                const probe = document.createElementNS(element.namespaceURI, element.localName)
                probe.style.setProperty(property, value)
                element.parentNode.append(probe)
                const expected = getComputedStyle(probe).getPropertyValue(property)
                probe.remove()
                return getComputedStyle(element).getPropertyValue(property) === expected
              })
            )
            results.push({
              selector: rule.selectorText,
              matched: elements.length,
              losing: painted.filter((_, index) => !wins[index]).map(([property]) => property)
            })
          }
          visit(rule.cssRules)
        }
      }
      visit(own.cssRules)
      return results
    })
    modeResults.push(rules)

    if (outDir) {
      const dir = join(outDir, mode.name)
      mkdirSync(dir, { recursive: true })
      for (const type of Object.keys(fixtures)) {
        await page
          .locator('.fixture', { has: page.locator(`h2:text-is("${type}")`) })
          .screenshot({ path: join(dir, `${type}.png`) })
      }
    }
  }

  // Report rules by selector once, not once per mode.
  const [rules] = modeResults
  rules.forEach((rule, index) => {
    if (modeResults.every(modeRules => modeRules[index].matched === 0)) {
      failures.push(`rule matches nothing Pele drew: ${rule.selector}`)
      return
    }
    for (const property of rule.losing) {
      if (modeResults.every(modeRules => modeRules[index].losing.includes(property))) {
        failures.push(`rule never wins for ${property}: ${rule.selector}`)
      }
    }
  })

  // Print mode must resolve to the light palette even under a dark scheme.
  const nodeFill = printMode =>
    page.evaluate(printMode => {
      document.documentElement.style.colorScheme = 'dark'
      const diagram = document.querySelector('.mermaid-diagram')
      diagram.classList.toggle('mermaid-diagram-print', printMode)
      diagram.style.colorScheme = printMode ? '' : 'light'
      return getComputedStyle(diagram.querySelector('.pele-node rect')).fill
    }, printMode)
  const light = await nodeFill(false)
  const print = await nodeFill(true)
  if (light !== print) failures.push(`print mode isn't light: node fill ${print}, light ${light}`)

  for (const error of pageErrors) failures.push(`page error: ${error}`)
  console.info(
    `Checked ${Object.keys(fixtures).length} diagram types × ${MODES.length} modes in ${engine.name()}, ` +
      `${rules.length} token rules, ${definitions.size} tokens.`
  )
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(failures.map(failure => `✗ ${failure}`).join('\n'))
  process.exit(1)
}
console.info('✓ styles/mermaid.css themes every diagram type')
