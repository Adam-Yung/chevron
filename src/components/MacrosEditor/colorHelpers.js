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

/**
 * Returns a single representative colour from a bgColor object.
 * For solid: the colour itself.
 * For gradient: the middle stop (or first if only one).
 * Used to tint matched filter characters on macro cards.
 */
export function midColor(bgColor) {
  if (!bgColor || typeof bgColor !== 'object') return '#ffffff'
  if (bgColor.type === 'solid') return typeof bgColor.color === 'string' ? bgColor.color : '#ffffff'
  if (bgColor.type === 'gradient') {
    const colors = Array.isArray(bgColor.colors) ? bgColor.colors : []
    if (colors.length === 0) return '#ffffff'
    return colors[Math.floor((colors.length - 1) / 2)]
  }
  return '#ffffff'
}

/**
 * Parses a hex colour string (#rgb or #rrggbb) into [r, g, b] in [0,1].
 * Returns null if the string is not a recognised hex colour.
 */
function parseHex(hex) {
  if (typeof hex !== 'string') return null
  const h = hex.replace('#', '')
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16) / 255
    const g = parseInt(h[1] + h[1], 16) / 255
    const b = parseInt(h[2] + h[2], 16) / 255
    return [r, g, b]
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16) / 255
    const g = parseInt(h.slice(2, 4), 16) / 255
    const b = parseInt(h.slice(4, 6), 16) / 255
    return [r, g, b]
  }
  return null
}

/**
 * WCAG relative luminance of an sRGB triplet in [0,1].
 */
function luminance([r, g, b]) {
  const lin = c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * WCAG contrast ratio between two luminance values.
 */
function contrast(l1, l2) {
  const lighter = Math.max(l1, l2)
  const darker  = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Returns a match-highlight colour derived from `bgColor` that is legible
 * against the card label text background.
 *
 * `isDarkMode` — true when the colour scheme is dark (label bg ≈ near-white),
 *                false for light mode (label bg ≈ near-black).
 *
 * Strategy:
 *  - Start with the midColor of the macro's bgColor.
 *  - Check contrast against the effective label-text backdrop.
 *  - If contrast < MIN_CONTRAST, walk candidate colours:
 *      1. The textColor prop (if passed and parses as hex)
 *      2. Pure white (#ffffff) or pure black (#000000) depending on mode
 *      3. A brightened version of the midColor (blend toward white/black)
 */
export function readableMatchColor(bgColor, isDarkMode, textColor) {
  const MIN_CONTRAST = 2.5
  // In dark mode, label text sits on a near-white surface (~lum 0.85).
  // In light mode, label text sits on a near-dark surface (~lum 0.06).
  const bgLum = isDarkMode ? 0.85 : 0.06

  const raw = midColor(bgColor)
  const parsed = parseHex(raw)

  // If we can't parse the hex (e.g. named colour or rgb()), just return it
  // and trust the author's intent.
  if (!parsed) return raw

  const rawLum = luminance(parsed)
  if (contrast(rawLum, bgLum) >= MIN_CONTRAST) return raw

  // Try textColor first — it's usually already chosen to contrast the macro bg
  if (textColor) {
    const tc = parseHex(textColor)
    if (tc && contrast(luminance(tc), bgLum) >= MIN_CONTRAST) return textColor
  }

  // Fallback: blend the raw colour heavily toward white (dark mode) or black
  // (light mode) until contrast is sufficient, up to 3 steps.
  let [r, g, b] = parsed
  const target = isDarkMode ? 1 : 0
  for (let i = 0; i < 4; i++) {
    r = r + (target - r) * 0.45
    g = g + (target - g) * 0.45
    b = b + (target - b) * 0.45
    const lum = luminance([r, g, b])
    if (contrast(lum, bgLum) >= MIN_CONTRAST) break
  }
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
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
