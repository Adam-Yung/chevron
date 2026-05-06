/**
 * Tiny pure helpers for the bgColor object used by macros and engines.
 * The shape is `{ type: 'solid', color }` OR
 * `{ type: 'gradient', gradientType, angle?, colors: [...], stops?: [...] }`
 *
 * Kept as plain functions (no imports) so the editor stays light.
 */

export function bgPreviewCss(bg) {
  if (!bg || typeof bg !== 'object') return 'transparent'
  if (bg.type === 'solid') return typeof bg.color === 'string' ? bg.color : 'transparent'
  if (bg.type === 'gradient') {
    const colors = Array.isArray(bg.colors) ? bg.colors : []
    if (colors.length === 0) return 'transparent'
    let angle = bg.angle ?? (bg.gradientType === 'linear' ? 45 : '')
    if (typeof angle === 'number') angle = angle + 'deg'
    const head = angle ? `${angle},` : ''
    const stops = Array.isArray(bg.stops) ? bg.stops : null
    const parts = colors.map((c, i) => stops && stops[i] != null ? `${c} ${stops[i]}%` : c)
    return `${bg.gradientType || 'linear'}-gradient(${head}${parts.join(',')})`
  }
  return 'transparent'
}

export function makeSolid(color = '#888888') {
  return { type: 'solid', color }
}

export function makeGradient(prev) {
  // Promote a solid to a 2-stop linear gradient seeded with the prev color.
  const seed = (prev && prev.type === 'solid' && prev.color) || '#888888'
  return {
    type: 'gradient',
    gradientType: 'linear',
    angle: 45,
    colors: [seed, '#000000']
  }
}
