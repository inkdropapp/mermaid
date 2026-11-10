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
 * - a rule that applies a token matches nothing Pele drew,
 * - such a rule matches but never wins (another declaration overrides it), or
 * - the canvas layout is off: the dot grid doesn't reach the edges of a
 *   preview card or a full-screen shell, a theme can't set the card padding,
 *   the toolbar doesn't keep clear of it, a `center` diagram (or one toggled
 *   while drawn) isn't centred, a zoomed or panned drawing doesn't cover the
 *   canvas, or a `fill` drawing doesn't fit inside the shell's padding.
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

import { fitToContainer } from '../src/fit.ts'
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

/**
 * Knobs styles/mermaid.css reads with a fallback, for a theme or host to set.
 * They aren't in the token sheet, so they're exempt from the undefined-token
 * check.
 */
const THEME_KNOBS = {
  'card-padding': 'Padding of the preview card around a diagram; defaults to 16px.',
  'diagram-inset': 'Room between the canvas edge and the drawing and toolbar; defaults to 0px.'
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
  if (!definitions.has(name) && !(name in THEME_KNOBS))
    failures.push(`styles/mermaid.css reads undefined token --mermaid-${name}`)
}
for (const name of Object.keys(UNUSED_TOKENS)) {
  if (effective.has(name))
    failures.push(`--mermaid-${name} is in UNUSED_TOKENS but does take effect`)
}

// --- Rendering (browser) ---------------------------------------------------

const hostCSS = HOST_SHEETS.map(name => readFileSync(join(cssDir, name), 'utf8')).join('\n')
const markdownCSS = readFileSync(join(cssDir, 'markdown.css'), 'utf8')
const peleScript = readFileSync(require.resolve('pele/global'), 'utf8')

/**
 * MermaidDiagram's markup (src/diagram.tsx). Both test pages build their
 * fixtures from this one copy, so keep it in step with the component.
 */
const diagramMarkup = ({ variants = [], print = false, toolbar = false } = {}) => {
  const classes = ['mermaid-diagram', ...variants.map(variant => `mermaid-diagram-${variant}`)]
  if (print) classes.push('mermaid-diagram-print')
  return (
    `<div class="${classes.join(' ')}"><div class="mermaid-diagram-content">` +
    `<div${print ? '' : ' class="mermaid-dot-grid"'}></div></div>` +
    (toolbar && !print
      ? '<div class="mermaid-toolbar"><div class="mermaid-toolbar-controls"><button>+</button></div></div>'
      : '') +
    '</div>'
  )
}

/** Puts diagramMarkup, and the real fitToContainer, on a test page's `window`. */
const pageHelpers = `window.diagramMarkup = ${diagramMarkup};\nwindow.fitToContainer = ${fitToContainer};`

/**
 * Runs in the layout page (injected as a script, so it can't close over
 * anything here) and sets `window.kit`: builds fixtures, measures them, and
 * collects failures.
 */
function layoutKit(code, renderOptions) {
  const preview = document.querySelector('.mde-preview')
  const errors = []
  const cases = new Map()
  const near = (a, b) => Math.abs(a - b) < 1
  const box = element => element.getBoundingClientRect()
  const px = (element, property) => parseFloat(getComputedStyle(element).getPropertyValue(property))
  const round = value => Math.round(value * 10) / 10
  const fail = (name, message) => errors.push(`${name}: ${message}`)
  const same = (a, b) => ['left', 'top', 'width', 'height'].every(side => near(a[side], b[side]))
  // The canvas's content box: where the drawing sits at rest.
  const content = canvas => {
    const rect = box(canvas)
    return {
      left: rect.left + px(canvas, 'padding-left'),
      top: rect.top + px(canvas, 'padding-top'),
      right: rect.right - px(canvas, 'padding-right'),
      bottom: rect.bottom - px(canvas, 'padding-bottom')
    }
  }

  window.kit = {
    errors,
    near,
    fail,
    frames: async () => {
      for (let i = 0; i < 2; i++) await new Promise(resolve => requestAnimationFrame(resolve))
    },
    /** Runs a case; a throw is that case's failure rather than the end of the check. */
    run: async (name, test) => {
      try {
        await test(name)
      } catch (err) {
        fail(name, err?.message ?? String(err))
      }
    },
    /**
     * Builds a diagram, toolbar included, in a `wrapper` element and mounts
     * the flowchart into it as useMermaidRendering does, `fill` fit included.
     */
    diagram: (
      name,
      { wrapper = 'pre', wrapperClass = '', variants = [], print = false, zoom = false } = {}
    ) => {
      const outer = document.createElement(wrapper)
      outer.className = wrapperClass
      outer.dataset.case = name
      outer.innerHTML = window.diagramMarkup({ variants, print, toolbar: true })
      preview.append(outer)
      const root = outer.firstElementChild
      const canvas = root.querySelector('.mermaid-diagram-content > div')
      const svg = () => canvas.querySelector(':scope > svg')
      const mounted = window.pele.mount(canvas, code, {
        ...renderOptions,
        zoom: zoom && { always: true, controls: false },
        onRender: result => variants.includes('fill') && window.fitToContainer(canvas, result)
      })
      if (!svg()) throw new Error('Pele drew no SVG')
      const built = {
        outer,
        root,
        canvas,
        svg,
        mounted,
        toolbar: root.querySelector('.mermaid-toolbar')
      }
      cases.set(name, built)
      return built
    },
    get: name => cases.get(name),
    /** Padding, as `top right bottom left`. */
    paddings: element =>
      ['top', 'right', 'bottom', 'left']
        .map(side => `${px(element, `padding-${side}`)}px`)
        .join(' '),
    /** The canvas fills the wrapper's padding box, where its background, and so the grid, shows. */
    fills: (name, { outer, canvas }) => {
      const rect = box(outer)
      const frame = {
        left: rect.left + outer.clientLeft,
        top: rect.top + outer.clientTop,
        width: outer.clientWidth,
        height: outer.clientHeight
      }
      if (!same(box(canvas), frame))
        fail(name, "the canvas doesn't fill its card, so the dot grid stops short")
    },
    /** The toolbar sits `right` and `bottom` px plus 0.2em in from the diagram's corner. */
    toolbarAt: (name, { root, toolbar }, right, bottom) => {
      const em = px(toolbar, 'font-size') * 0.2
      const outerRect = box(root)
      const rect = box(toolbar)
      const [x, y] = [outerRect.right - rect.right, outerRect.bottom - rect.bottom]
      if (!near(x, right + em) || !near(y, bottom + em))
        fail(
          name,
          `the toolbar is ${round(x)}px/${round(y)}px in, not ${round(right + em)}px/${round(bottom + em)}px`
        )
    },
    /** At rest, the drawing starts at the canvas padding, which is all the room below it. */
    atStart: (name, { canvas, svg }) => {
      const [area, rect] = [content(canvas), box(svg())]
      if (!near(rect.left, area.left))
        fail(name, 'the drawing is not at the start of the canvas padding')
      if (!near(rect.bottom, area.bottom))
        fail(name, `${round(area.bottom - rect.bottom)}px of extra room below the drawing`)
    },
    /** Equal room either side of a drawing narrower than the canvas. */
    centred: (name, { canvas, svg }) => {
      const outerRect = box(canvas)
      const rect = box(svg())
      if (rect.width > outerRect.width - 64) throw new Error('the fixture is too wide to tell')
      if (!near(rect.left - outerRect.left, outerRect.right - rect.right))
        fail(name, 'the drawing is not centred on the canvas')
    },
    /** A zoomed drawing covers the canvas, so a pan reaches the card edge. */
    covers: (name, { canvas, svg }) => {
      const [drawing, area] = [box(svg()), box(canvas)]
      const at = rect =>
        `${round(rect.left)},${round(rect.top)} ${round(rect.width)}×${round(rect.height)}`
      if (!same(drawing, area))
        fail(name, `the drawing (${at(drawing)}) doesn't cover the canvas (${at(area)})`)
    },
    /** At rest, a `fill` drawing fits inside the canvas padding and meets it on one axis. */
    fitted: (name, { canvas, svg, mounted }) => {
      const area = content(canvas)
      const rect = box(svg())
      // The flex column shrinks an SVG that is too tall to fit, which only
      // letterboxes the drawing inside it, so the box must keep its shape too.
      const { width, height } = mounted.result
      if (!near(rect.height * (width / height), rect.width))
        fail(name, `the drawing is letterboxed in a ${round(rect.width)}×${round(rect.height)} box`)
      const inside =
        rect.left > area.left - 1 &&
        rect.top > area.top - 1 &&
        rect.right < area.right + 1 &&
        rect.bottom < area.bottom + 1
      const meets =
        near(rect.width, area.right - area.left) || near(rect.height, area.bottom - area.top)
      if (!inside || !meets)
        fail(
          name,
          `the drawing (${round(rect.width)}×${round(rect.height)}) doesn't fit the padded ` +
            `canvas (${round(area.right - area.left)}×${round(area.bottom - area.top)})`
        )
    }
  }
}

/**
 * Check the canvas layout: the markup MermaidDiagram renders, in the preview's
 * code-block card (markdown.css, in its theme layer) and in a full-screen
 * shell. Returns failures.
 */
async function checkLayout(browser) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } })
  const failures = []
  page.on('pageerror', err => failures.push(`page error: ${err.message}`))
  // A step that throws is reported, so the failures found so far still print.
  const step = async action => {
    try {
      await action()
    } catch (err) {
      failures.push(err.message)
    }
  }

  await page.setContent(`<!doctype html><html><head>
    <style>${hostCSS}\n${markdownCSS}</style>
    <style>${ownSheet}</style>
    <style>
      /* Themes that pad their code blocks differently, from their own layer. */
      @layer theme.preview.base {
        .mde-preview pre.themed { --mermaid-card-padding: 8px; padding: 40px; }
        .mde-preview pre.asymmetric { --mermaid-card-padding: 8px 12px; padding: 8px 12px; }
      }
      body { margin: 16px; } .mde-preview { width: 900px; }
      .shell { width: 600px; height: 400px; --mermaid-diagram-inset: 32px; }
      .shell.short { height: 160px; }
    </style>
  </head><body><div class="mde-preview"></div></body></html>`)
  await page.addScriptTag({ content: peleScript })
  await page.addScriptTag({ content: pageHelpers })
  await page.addScriptTag({
    content: `(${layoutKit})(${JSON.stringify(fixtures.flowchart)}, ${JSON.stringify(RENDER_OPTIONS)})`
  })

  const zoomedCases = ['zoomed', 'zoomed-center']

  await step(() =>
    page.evaluate(async zoomedCases => {
      const {
        run,
        diagram,
        fail,
        paddings,
        fills,
        toolbarAt,
        atStart,
        centred,
        covers,
        fitted,
        frames
      } = window.kit

      await run('card', name => {
        const card = diagram(name)
        if (paddings(card.outer) !== '0px 0px 0px 0px')
          fail(name, `pre keeps padding ${paddings(card.outer)}`)
        if (paddings(card.canvas) !== '16px 16px 16px 16px')
          fail(name, `canvas padding is ${paddings(card.canvas)}, not 16px`)
        fills(name, card)
        atStart(name, card)
        toolbarAt(name, card, 16, 16)
      })

      await run('themed card', name => {
        const card = diagram(name, { wrapperClass: 'themed' })
        if (paddings(card.outer) !== '0px 0px 0px 0px')
          fail(name, `pre keeps padding ${paddings(card.outer)}`)
        if (paddings(card.canvas) !== '8px 8px 8px 8px')
          fail(name, `canvas padding is ${paddings(card.canvas)}, not the theme's 8px`)
        toolbarAt(name, card, 8, 8)
      })
      await run('asymmetric card', name => {
        const card = diagram(name, { wrapperClass: 'asymmetric' })
        if (paddings(card.canvas) !== '8px 12px 8px 12px')
          fail(name, `canvas padding is ${paddings(card.canvas)}, not the theme's 8px 12px`)
        toolbarAt(name, card, 12, 8)
      })

      await run('print card', name => {
        const card = diagram(name, { print: true })
        if (paddings(card.outer) !== '16px 16px 16px 16px')
          fail(name, `pre padding is ${paddings(card.outer)}, not 16px`)
        if (paddings(card.canvas) !== '0px 0px 0px 0px')
          fail(name, `canvas padding is ${paddings(card.canvas)}`)
      })

      await run('center', name => centred(name, diagram(name, { variants: ['center'] })))

      await run('center toggle', async name => {
        const toggled = diagram(name, { zoom: true })
        const center = on => toggled.root.classList.toggle('mermaid-diagram-center', on)
        atStart(`${name} (off)`, toggled)
        center(true)
        centred(`${name} (on)`, toggled)
        toggled.mounted.zoom.zoomTo(toggled.mounted.zoom.fit * 4)
        await frames()
        covers(`${name} (on, zoomed)`, toggled)
        center(false)
        await frames()
        covers(`${name} (off while zoomed)`, toggled)
        toggled.mounted.zoom.reset()
        await frames()
        atStart(`${name} (off, reset)`, toggled)
        center(true)
        centred(`${name} (on again)`, toggled)
      })

      // Remember the viewBox, to tell that the drag below pans.
      for (const name of zoomedCases) {
        await run(name, async () => {
          const zoomed = diagram(name, {
            variants: name.endsWith('center') ? ['center'] : [],
            zoom: true
          })
          zoomed.mounted.zoom.zoomTo(zoomed.mounted.zoom.fit * 4)
          await frames()
          covers(name, zoomed)
          zoomed.outer.dataset.viewBox = zoomed.svg().getAttribute('viewBox')
        })
      }

      for (const [name, wrapperClass] of [
        ['fill', 'shell'],
        ['fill, short shell', 'shell short']
      ]) {
        await run(name, () => {
          const shell = diagram(name, { wrapper: 'div', wrapperClass, variants: ['fill'] })
          if (paddings(shell.canvas) !== '32px 32px 32px 32px')
            fail(name, `canvas padding is ${paddings(shell.canvas)}, not the shell's 32px`)
          fills(name, shell)
          fitted(name, shell)
          toolbarAt(name, shell, 32, 32)
        })
      }

      await run('fit, detached', name => {
        const detached = document.createElement('div')
        detached.innerHTML = '<svg></svg>'
        window.fitToContainer(detached, { width: 100, height: 50 })
        if (detached.firstElementChild.getAttribute('style'))
          fail(name, 'sized the SVG of a detached container')
      })
    }, zoomedCases)
  )

  for (const name of zoomedCases) {
    await step(async () => {
      const canvas = page.locator(`[data-case="${name}"] .mermaid-diagram-content > div`)
      if (!(await canvas.count())) return // its case above already failed
      await canvas.scrollIntoViewIfNeeded()
      const rect = await canvas.boundingBox()
      const [x, y] = [rect.x + rect.width / 2, rect.y + rect.height / 2]
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x - rect.width / 3, y - rect.height / 3, { steps: 8 })
      await page.mouse.up()
    })
  }
  await step(() =>
    page.evaluate(async zoomedCases => {
      const { get, fail, covers, frames } = window.kit
      await frames()
      for (const name of zoomedCases) {
        const zoomed = get(name)
        if (!zoomed?.outer.dataset.viewBox) continue
        if (zoomed.svg().getAttribute('viewBox') === zoomed.outer.dataset.viewBox)
          fail(`${name}, panned`, "dragging didn't pan the drawing")
        covers(`${name}, panned`, zoomed)
      }
    }, zoomedCases)
  )

  await step(async () => failures.push(...(await page.evaluate(() => window.kit.errors))))
  await page.close()
  return failures.map(failure => `layout: ${failure}`)
}

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
  await page.addScriptTag({ content: pageHelpers })

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
          section.innerHTML = `<h2>${type}</h2>${window.diagramMarkup({ print: mode.print })}`
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
    // Rules that only read a theme knob lay out the card; the layout check
    // below covers them.
    const rules = await page.evaluate(knobs => {
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
            .filter(([, value]) =>
              [...value.matchAll(/var\(\s*--mermaid-([a-z0-9-]+)/g)].some(
                ([, name]) => !knobs.includes(name)
              )
            )
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
    }, Object.keys(THEME_KNOBS))
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

  failures.push(...(await checkLayout(browser)))

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
