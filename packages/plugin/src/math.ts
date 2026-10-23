import { createKatexMath } from '@inkdropapp/mermaid'
import katex from 'katex'

/** Typesets `$$...$$` in diagram labels. Module-level, so it stays stable. */
export const math = createKatexMath(katex)
