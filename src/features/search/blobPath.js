/**
 * The search blob: the region between the left screen edge and a curve bulging out to `reach` at mid-height.
 * `top` and `bottom` (0..1) bend the curve near its ends, as the chevron.quickLook curvature settings always did.
 * @returns {{ fill: string, stroke: string }} SVG path data in px
 */
export function blobPath({ reach, height, top, bottom }) {
  const r = round(reach)
  const h = round(height)
  const mid = round(height / 2)
  const upper = `C0,${round(bottom * height)} ${r},${round(top * height)} ${r},${mid}`
  const lower = `C${r},${round(height - top * height)} 0,${round(height - bottom * height)} 0,${h}`
  const stroke = `M0,0 ${upper} ${lower}`
  return { stroke, fill: `${stroke} Z` }
}

const round = n => Math.round(n * 10) / 10
