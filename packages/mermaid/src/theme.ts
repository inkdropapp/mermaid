import type { MermaidConfig } from 'mermaid'

type ThemeVariables = NonNullable<MermaidConfig['themeVariables']>

/**
 * The `surface*` / `surfacePeer*` overrides (block / C4 diagrams). All five
 * depth levels share the cluster surface/border tokens.
 */
const surfaceTokens = (): Record<string, string> =>
  Object.fromEntries(
    Array.from({ length: 5 }, (_, i) => [
      [`surface${i}`, 'surface-background-color'],
      [`surfacePeer${i}`, 'surface-border-color']
    ]).flat()
  )

/**
 * Mermaid `themeVariables` key → Inkdrop `--mermaid-*` token (the suffix after
 * `--mermaid-`). Every Mermaid colour we drive has its own explicit token; the
 * tokens themselves cascade from a handful of base ones in
 * `@inkdropapp/css/mermaid.css` (e.g. `--mermaid-actor-background-color`
 * defaults to `var(--mermaid-node-background-color)`), so a theme can override
 * one surface or a whole family.
 *
 * Each token is resolved to a concrete colour at render time (see
 * {@link buildInkdropThemeVariables}), so diagrams follow the active theme —
 * light/dark via `light-dark()` in `mermaid.css`.
 */
const tokens: Record<string, string> = {
  // --- Canvas / general ---
  background: 'background-color',
  textColor: 'text-color',
  titleColor: 'title-color',
  lineColor: 'line-color',
  arrowheadColor: 'arrowhead-color',
  defaultLinkColor: 'default-link-color',
  vertLineColor: 'vert-line-color',

  // --- Flowchart / generic nodes ---
  mainBkg: 'node-background-color',
  nodeBkg: 'node-background-color',
  secondBkg: 'cluster-background-color',
  nodeBorder: 'node-border-color',
  border1: 'node-border-color',
  nodeTextColor: 'node-text-color',
  labelColor: 'label-color',
  labelBackgroundColor: 'edge-label-background-color',
  border2: 'secondary-border-color',
  clusterBkg: 'cluster-background-color',
  clusterBorder: 'cluster-border-color',
  edgeLabelBackground: 'edge-label-background-color',
  rectBkgColor: 'cluster-background-color',
  ...surfaceTokens(),

  // --- Entity-relationship rows / attributes / relations ---
  rowOdd: 'row-odd-background-color',
  rowEven: 'row-even-background-color',
  attributeBackgroundColorOdd: 'attribute-odd-background-color',
  attributeBackgroundColorEven: 'attribute-even-background-color',
  relationColor: 'relation-color',
  relationLabelColor: 'relation-label-color',
  relationLabelBackground: 'relation-label-background-color',

  // --- Sequence ---
  actorBkg: 'actor-background-color',
  actorBorder: 'actor-border-color',
  actorTextColor: 'actor-text-color',
  actorLineColor: 'actor-line-color',
  signalColor: 'signal-color',
  signalTextColor: 'signal-text-color',
  labelBoxBkgColor: 'label-box-background-color',
  labelBoxBorderColor: 'label-box-border-color',
  labelTextColor: 'label-text-color',
  loopTextColor: 'loop-text-color',
  activationBkgColor: 'activation-background-color',
  activationBorderColor: 'activation-border-color',
  sequenceNumberColor: 'sequence-number-color',
  noteBkgColor: 'note-background-color',
  noteBorderColor: 'note-border-color',
  noteTextColor: 'note-text-color',

  // --- Class ---
  classText: 'class-text-color',

  // --- State ---
  stateBkg: 'state-background-color',
  stateBorder: 'state-border-color',
  stateLabelColor: 'state-label-color',
  transitionColor: 'transition-color',
  transitionLabelColor: 'transition-label-color',
  specialStateColor: 'special-state-color',
  compositeBackground: 'composite-background-color',
  compositeTitleBackground: 'composite-title-background-color',
  compositeBorder: 'composite-border-color',
  altBackground: 'alt-background-color',
  innerEndBackground: 'inner-end-background-color',

  // --- Error (bad diagram / broken link) ---
  errorBkgColor: 'error-background-color',
  errorTextColor: 'error-text-color',

  // --- C4 ---
  personBkg: 'person-background-color',
  personBorder: 'person-border-color',

  // --- Architecture ---
  archEdgeColor: 'arch-edge-color',
  archEdgeArrowColor: 'arch-edge-arrow-color',
  archGroupBorderColor: 'arch-group-border-color',

  // --- Requirement ---
  requirementBackground: 'requirement-background-color',
  requirementBorderColor: 'requirement-border-color',
  requirementTextColor: 'requirement-text-color',

  // --- Gantt ---
  sectionBkgColor: 'section-background-color',
  sectionBkgColor2: 'alt-section-background-color',
  altSectionBkgColor: 'alt-section-background-color',
  excludeBkgColor: 'exclude-background-color',
  taskBkgColor: 'task-background-color',
  taskBorderColor: 'task-border-color',
  taskTextColor: 'task-text-color',
  taskTextLightColor: 'task-text-light-color',
  taskTextDarkColor: 'task-text-dark-color',
  taskTextOutsideColor: 'task-text-outside-color',
  taskTextClickableColor: 'task-text-clickable-color',
  activeTaskBkgColor: 'active-task-background-color',
  activeTaskBorderColor: 'active-task-border-color',
  doneTaskBkgColor: 'done-task-background-color',
  doneTaskBorderColor: 'done-task-border-color',
  critBkgColor: 'crit-task-background-color',
  critBorderColor: 'crit-task-border-color',
  gridColor: 'grid-color',
  todayLineColor: 'today-line-color',

  // --- Pie ---
  pieTitleTextColor: 'pie-title-text-color',
  pieSectionTextColor: 'pie-section-text-color',
  pieLegendTextColor: 'pie-legend-text-color',
  pieStrokeColor: 'pie-stroke-color',
  pieOuterStrokeColor: 'pie-outer-stroke-color',

  // --- Quadrant ---
  quadrant1Fill: 'quadrant-1-background-color',
  quadrant2Fill: 'quadrant-2-background-color',
  quadrant3Fill: 'quadrant-3-background-color',
  quadrant4Fill: 'quadrant-4-background-color',
  quadrant1TextFill: 'quadrant-text-color',
  quadrant2TextFill: 'quadrant-text-color',
  quadrant3TextFill: 'quadrant-text-color',
  quadrant4TextFill: 'quadrant-text-color',
  quadrantPointFill: 'quadrant-point-color',
  quadrantPointTextFill: 'quadrant-text-color',
  quadrantXAxisTextFill: 'quadrant-text-color',
  quadrantYAxisTextFill: 'quadrant-text-color',
  quadrantTitleFill: 'quadrant-title-color',
  quadrantInternalBorderStrokeFill: 'quadrant-border-color',
  quadrantExternalBorderStrokeFill: 'quadrant-border-color',

  // --- Venn ---
  vennTitleTextColor: 'venn-title-text-color',
  vennSetTextColor: 'venn-set-text-color',

  // --- Git ---
  commitLabelColor: 'commit-label-color',
  commitLabelBackground: 'commit-label-background-color',
  tagLabelColor: 'tag-label-color',
  tagLabelBackground: 'tag-label-background-color',
  tagLabelBorder: 'tag-label-border-color',

  // --- Event modeling ---
  emUiFill: 'em-ui-background-color',
  emUiStroke: 'em-ui-border-color',
  emProcessorFill: 'em-processor-background-color',
  emProcessorStroke: 'em-processor-border-color',
  emReadModelFill: 'em-read-model-background-color',
  emReadModelStroke: 'em-read-model-border-color',
  emCommandFill: 'em-command-background-color',
  emCommandStroke: 'em-command-border-color',
  emEventFill: 'em-event-background-color',
  emEventStroke: 'em-event-border-color',
  emSwimlaneBackgroundOdd: 'em-swimlane-background-color',
  emSwimlaneBackgroundStroke: 'em-swimlane-border-color',
  emArrowhead: 'em-arrowhead-color',
  emRelationStroke: 'em-relation-color',

  // --- Seed palette: drives Mermaid's categorical scales (pie / git / quadrant) ---
  primaryColor: 'primary-color',
  secondaryColor: 'secondary-color',
  tertiaryColor: 'tertiary-color',
  primaryTextColor: 'primary-text-color'
}

/**
 * Diagram themes Mermaid exposes as a *nested object* rather than a flat key
 * (packet, xychart, radar, wardley, cynefin). Mermaid re-applies the whole
 * override object verbatim after deriving defaults, so each object must be
 * complete — colour props resolve from `--mermaid-*` tokens, non-colour props
 * (widths / font sizes / the xychart data-series palette) are Mermaid's own
 * base defaults, kept as literals so nothing is dropped. Re-check these on a
 * Mermaid upgrade.
 *
 * `packet` in particular has no entry in Mermaid's `base` theme at all, so
 * without this it renders unthemed.
 */
const buildNestedGroups = (resolve: (token: string) => string): Record<string, unknown> => ({
  packet: {
    startByteColor: resolve('packet-byte-color'),
    endByteColor: resolve('packet-byte-color'),
    labelColor: resolve('packet-label-color'),
    titleColor: resolve('packet-title-color'),
    blockStrokeColor: resolve('packet-block-border-color'),
    blockFillColor: resolve('packet-block-background-color')
  },
  xyChart: {
    backgroundColor: resolve('xychart-background-color'),
    titleColor: resolve('xychart-title-color'),
    dataLabelColor: resolve('xychart-text-color'),
    legendTextColor: resolve('xychart-text-color'),
    xAxisTitleColor: resolve('xychart-axis-color'),
    xAxisLabelColor: resolve('xychart-axis-color'),
    xAxisTickColor: resolve('xychart-axis-color'),
    xAxisLineColor: resolve('xychart-axis-color'),
    yAxisTitleColor: resolve('xychart-axis-color'),
    yAxisLabelColor: resolve('xychart-axis-color'),
    yAxisTickColor: resolve('xychart-axis-color'),
    yAxisLineColor: resolve('xychart-axis-color'),
    // Data-series palette: a categorical list a single colour var can't express.
    plotColorPalette:
      '#FFF4DD,#FFD8B1,#FFA07A,#ECEFF1,#D6DBDF,#C3E0A8,#FFB6A4,#FFD74D,#738FA7,#FFFFF0'
  },
  wardley: {
    backgroundColor: resolve('wardley-background-color'),
    axisColor: resolve('wardley-axis-color'),
    axisTextColor: resolve('wardley-axis-text-color'),
    gridColor: resolve('wardley-grid-color'),
    componentFill: resolve('wardley-component-background-color'),
    componentStroke: resolve('wardley-component-border-color'),
    componentLabelColor: resolve('wardley-component-label-color'),
    linkStroke: resolve('wardley-link-color'),
    evolutionStroke: resolve('wardley-evolution-color'),
    annotationStroke: resolve('wardley-annotation-border-color'),
    annotationTextColor: resolve('wardley-annotation-text-color'),
    annotationFill: resolve('wardley-annotation-background-color')
  },
  radar: {
    axisColor: resolve('radar-axis-color'),
    graticuleColor: resolve('radar-graticule-color'),
    axisStrokeWidth: 2,
    axisLabelFontSize: 12,
    curveOpacity: 0.5,
    curveStrokeWidth: 2,
    graticuleStrokeWidth: 1,
    graticuleOpacity: 0.3,
    legendBoxSize: 12,
    legendFontSize: 12
  },
  cynefin: {
    boundaryColor: resolve('cynefin-boundary-color'),
    cliffColor: resolve('cynefin-cliff-color'),
    arrowColor: resolve('cynefin-arrow-color'),
    complexBg: resolve('cynefin-complex-background-color'),
    complicatedBg: resolve('cynefin-complicated-background-color'),
    chaoticBg: resolve('cynefin-chaotic-background-color'),
    clearBg: resolve('cynefin-clear-background-color'),
    confusionBg: resolve('cynefin-confusion-background-color'),
    textColor: resolve('cynefin-text-color'),
    labelColor: resolve('cynefin-label-color'),
    domainFontSize: 16,
    itemFontSize: 12,
    boundaryWidth: 2,
    cliffWidth: 4,
    arrowWidth: 2
  }
})

/**
 * Build Mermaid's `themeVariables` for the built-in `inkdrop` theme.
 *
 * Mermaid's `base` theme runs colours through **khroma**, which throws on a raw
 * `var()`. Rather than patch khroma, we hand it concrete colours: every
 * `--mermaid-*` token is resolved to an `rgb(...)` value by `resolve` (see
 * `resolveInkdropThemeVariables` in `utils.ts`) at render time. That includes
 * the seed palette, so even the categorical scales (pie / git / quadrant) that
 * Mermaid derives from `primaryColor`/`secondaryColor`/`tertiaryColor` follow
 * the active theme.
 *
 * @param resolve - Maps a `--mermaid-*` token (the suffix after `--mermaid-`) to
 *   the concrete colour the active theme paints it, e.g.
 *   `'node-background-color'` → `'rgb(...)'`.
 * @returns A `themeVariables` map of resolved colours (plus the nested
 *   per-diagram config objects).
 */
export const buildInkdropThemeVariables = (resolve: (token: string) => string): ThemeVariables =>
  ({
    ...Object.fromEntries(Object.entries(tokens).map(([key, token]) => [key, resolve(token)])),
    ...buildNestedGroups(resolve)
  }) as ThemeVariables
