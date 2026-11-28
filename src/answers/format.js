// Digits kept before noise stripping: enough to hide binary-float artefacts such as
// 0.30000000000000004 without losing exact integers up to ~1e15.
const NOISE_DIGITS = 12

/** Display form: no float noise, separators or trailing zeros; '' for NaN and Infinity. */
export function formatNumber(value, significant = 8) {
  if (!Number.isFinite(value)) return ''
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value)
  const clean = Number(value.toPrecision(NOISE_DIGITS))
  if (Number.isInteger(clean) && Math.abs(clean) < 1e15) return String(clean)
  return String(Number(clean.toPrecision(significant)))
}
