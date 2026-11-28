// Pure helpers for the `bgColor` object of macros and engines; BgColorEditor describes its two shapes.

function gradientCss(bg) {
  const colors = Array.isArray(bg.colors) ? bg.colors : []
  if (colors.length === 0) return 'transparent'
  const kind = bg.gradientType || 'linear'
  const angle = bg.angle ?? (bg.gradientType === 'linear' ? 45 : '')
  const head = angle === '' ? '' : `${typeof angle === 'number' ? angle + 'deg' : angle},`
  const stops = Array.isArray(bg.stops) ? bg.stops : null
  const parts = colors.map((c, i) => (stops && stops[i] != null ? `${c} ${stops[i]}%` : c))
  return `${kind}-gradient(${head}${parts.join(',')})`
}

export function bgPreviewCss(bg) {
  if (!bg || typeof bg !== 'object') return 'transparent'
  if (bg.type === 'solid') return typeof bg.color === 'string' ? bg.color : 'transparent'
  return bg.type === 'gradient' ? gradientCss(bg) : 'transparent'
}

export function makeSolid(color = '#888888') {
  return { type: 'solid', color }
}

export function makeGradient(prev) {
  // A solid becomes a two-stop gradient seeded with its colour.
  const seed = (prev && prev.type === 'solid' && prev.color) || '#888888'
  return {
    type: 'gradient',
    gradientType: 'linear',
    angle: 45,
    colors: [seed, '#000000']
  }
}
