// SVG clean-up and colour suggestion for add-icon.mjs. Pure.

// Strip XML preamble, comments and title, collapse to one line, and inherit the text colour unless a fill is set.
export function sanitiseSvg(raw) {
  let svg = raw.trim()
  svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '')
  svg = svg.replace(/<!--[\s\S]*?-->/g, '')
  svg = svg.replace(/<title>[^<]*<\/title>/g, '')
  svg = svg.replace(/\s+/g, ' ').trim()
  if (!/<svg[^>]*\bfill\s*=/.test(svg)) {
    svg = svg.replace('<svg ', '<svg fill="currentColor" ')
  }
  return svg
}

// Hex colours from fill/stroke attributes and styles, black and white left out.
export function extractSvgColors(svg) {
  const hexes = new Set()
  const re = /(?:fill|stroke)\s*[:=]\s*["']?\s*(#[0-9a-fA-F]{3,8})\b/g
  let m
  while ((m = re.exec(svg))) {
    const c = m[1].toLowerCase()
    if (c !== '#000' && c !== '#000000' && c !== '#fff' && c !== '#ffffff') {
      hexes.add(c.length === 4 ? '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c)
    }
  }
  return [...hexes]
}

export function formatColorSuggestion(suggestion) {
  if (!suggestion) return '  (no color suggestion available)'
  const { colors, via } = suggestion
  if (colors.length === 1) {
    return `  Suggested bgColor (${via}):  { type: 'solid', color: '${colors[0]}' }`
  }
  const arr = colors.map(c => `'${c}'`).join(', ')
  return `  Suggested bgColor (${via}):  { type: 'gradient', gradientType: 'linear', angle: 45, colors: [${arr}] }`
}
