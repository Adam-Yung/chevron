// Digits kept before noise stripping: enough to hide binary-float artefacts such as
// 0.30000000000000004 without losing exact integers up to ~1e15.
const NOISE_DIGITS = 12

/**
 * Formats a number for display: no float noise, no thousands separators (answers are
 * copied on Enter and pasted into other tools), no trailing zeros.
 * @param {number} value
 * @param {number} [significant] significant digits for non-integers
 * @returns {string} '' for NaN and Infinity
 */
export function formatNumber(value, significant = 8) {
  if (!Number.isFinite(value)) return ''
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value)
  const clean = Number(value.toPrecision(NOISE_DIGITS))
  if (Number.isInteger(clean) && Math.abs(clean) < 1e15) return String(clean)
  return String(Number(clean.toPrecision(significant)))
}
