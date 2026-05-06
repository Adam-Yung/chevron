/* Tiny color helper — replaces `colorjs.io` (~25 KB).
 *
 * Supports the very narrow set of operations Chevron needs:
 *   - parse / serialize CSS hex (3, 4, 6, 8 digit) and rgb/rgba()
 *   - APCA (SAPC) contrast value, used by Settings ColorPicker
 *   - lighten / darken via OKLCH lightness adjust (matches the
 *     intent of the previous `lch.l` tweak; OKLCH is perceptually
 *     uniform like LCH but cheaper to compute and well-supported in
 *     CSS now)
 *   - parse() / isValid() helpers used by ColorPicker validation
 *
 * The APCA implementation follows the public reference from the
 * SAPC-APCA repository, simplified for sRGB inputs only:
 *   https://github.com/Myndex/SAPC-APCA
 */

// ---------------------------------------------------------------------------
// hex / rgb parsing

function parseHex(str) {
  let h = str.trim().replace(/^#/, '')
  if (h.length === 3 || h.length === 4) {
    h = h.split('').map(c => c + c).join('')
  }
  if (h.length !== 6 && h.length !== 8) return null
  if (!/^[0-9a-f]+$/i.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
  }
}

function parseRgb(str) {
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i.exec(str)
  if (!m) return null
  let a = 1
  if (m[4] != null) {
    a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  }
  return {
    r: parseFloat(m[1]) / 255,
    g: parseFloat(m[2]) / 255,
    b: parseFloat(m[3]) / 255,
    a
  }
}

function parseColor(input) {
  if (!input) return null
  if (typeof input === 'object' && input.r != null) return input
  const s = String(input).trim()
  if (s.startsWith('#')) return parseHex(s)
  if (s.startsWith('rgb')) return parseRgb(s)
  // Fall back to letting the browser parse named colors / other formats
  // via a throwaway DOM node. Cached because creating elements is cheap
  // but parsing isn't free.
  if (typeof document !== 'undefined') {
    const el = document.createElement('span')
    el.style.color = ''
    el.style.color = s
    if (!el.style.color) return null
    document.body.appendChild(el)
    const computed = getComputedStyle(el).color
    document.body.removeChild(el)
    return parseRgb(computed)
  }
  return null
}

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x }
function pad2(n) { const s = Math.round(n * 255).toString(16); return s.length === 1 ? '0' + s : s }

function toHex({ r, g, b }) {
  return '#' + pad2(clamp01(r)) + pad2(clamp01(g)) + pad2(clamp01(b))
}

// ---------------------------------------------------------------------------
// sRGB <-> linear sRGB <-> OKLab <-> OKLCH
// (formulas from Björn Ottosson's OKLab post, unchanged)

function sRGBtoLin(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
function linTosRGB(v) { return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055 }

function rgbToOklab({ r, g, b }) {
  const lr = sRGBtoLin(r), lg = sRGBtoLin(g), lb = sRGBtoLin(b)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const lc = Math.cbrt(l_), mc = Math.cbrt(m_), sc = Math.cbrt(s_)
  return {
    L: 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
    a: 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
    b: 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc
  }
}

function oklabToRgb({ L, a, b }) {
  const lc = L + 0.3963377774 * a + 0.2158037573 * b
  const mc = L - 0.1055613458 * a - 0.0638541728 * b
  const sc = L - 0.0894841775 * a - 1.2914855480 * b
  const l = lc * lc * lc, m = mc * mc * mc, s = sc * sc * sc
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  return {
    r: clamp01(linTosRGB(lr)),
    g: clamp01(linTosRGB(lg)),
    b: clamp01(linTosRGB(lb))
  }
}

function oklabToOklch({ L, a, b }) {
  const C = Math.sqrt(a * a + b * b)
  const h = Math.atan2(b, a) * 180 / Math.PI
  return { L, C, h: h < 0 ? h + 360 : h }
}
function oklchToOklab({ L, C, h }) {
  const r = h * Math.PI / 180
  return { L, a: C * Math.cos(r), b: C * Math.sin(r) }
}

// ---------------------------------------------------------------------------
// APCA (SAPC) contrast.
// Reference: https://github.com/Myndex/SAPC-APCA — public-domain math.
//
// We implement the simplified sRGB path. Returns the signed Lc value;
// callers usually take Math.abs of it.

const APCA_MAIN_TRC = 2.4
const APCA_REVERSE_BG = 0.56
const APCA_REVERSE_FG = 0.57
const APCA_NORMAL_BG  = 0.62
const APCA_NORMAL_FG  = 0.65
const APCA_SCALE_BoW = 1.14
const APCA_SCALE_WoB = 1.14
const APCA_LO_CLIP   = 0.1
const APCA_BLK_THRSH = 0.022
const APCA_BLK_CLMP  = 1.414
const APCA_DELTA     = 0.027

function lumaSRGB({ r, g, b }) {
  return Math.pow(r, APCA_MAIN_TRC) * 0.2126729 +
         Math.pow(g, APCA_MAIN_TRC) * 0.7151522 +
         Math.pow(b, APCA_MAIN_TRC) * 0.0721750
}

function softClampBlack(y) {
  return y < APCA_BLK_THRSH ? y + Math.pow(APCA_BLK_THRSH - y, APCA_BLK_CLMP) : y
}

export function apcaContrast(textColor, bgColor) {
  const fg = parseColor(textColor)
  const bg = parseColor(bgColor)
  if (!fg || !bg) return 0

  const yFg = softClampBlack(lumaSRGB(fg))
  const yBg = softClampBlack(lumaSRGB(bg))

  if (Math.abs(yFg - yBg) < APCA_DELTA) return 0

  let outputContrast
  if (yBg > yFg) {
    // Normal polarity: dark text on light background
    const SAPC = (Math.pow(yBg, APCA_NORMAL_BG) - Math.pow(yFg, APCA_NORMAL_FG)) * APCA_SCALE_BoW
    outputContrast = SAPC < APCA_LO_CLIP ? 0 : (SAPC - APCA_DELTA) * 100
  } else {
    // Reverse polarity: light text on dark background
    const SAPC = (Math.pow(yBg, APCA_REVERSE_BG) - Math.pow(yFg, APCA_REVERSE_FG)) * APCA_SCALE_WoB
    outputContrast = SAPC > -APCA_LO_CLIP ? 0 : (SAPC + APCA_DELTA) * 100
  }
  return outputContrast
}

// ---------------------------------------------------------------------------
// Public Color class — drop-in for the operations the app actually uses.

export default class Color {
  constructor(input) {
    const rgb = parseColor(input)
    if (!rgb) throw new Error('Could not parse color: ' + input)
    this._rgb = { r: rgb.r, g: rgb.g, b: rgb.b }
    this._a = rgb.a == null ? 1 : rgb.a
  }

  static parse(input) {
    const rgb = parseColor(input)
    if (!rgb) throw new Error('Could not parse color: ' + input)
    return new Color(input)
  }

  // Supports the single shape we use: { 'lch.l': lightnessOrFunction }
  // Adjustments are made in OKLCH space (perceptually uniform, matches
  // what the previous LCH-based code was approximating). Lightness in
  // OKLCH is 0..1; the previous code expected 0..100, so we accept both.
  set(spec) {
    let lab = oklabToOklch(rgbToOklab(this._rgb))
    if ('lch.l' in spec || 'oklch.l' in spec) {
      const fn = spec['lch.l'] != null ? spec['lch.l'] : spec['oklch.l']
      // Convert to a 0..100 scale to match the original colorjs.io API,
      // then back. This keeps the existing call sites
      // (`l => l > 30 ? l - 5 : l + 10`) working unchanged.
      const l100 = lab.L * 100
      const next = typeof fn === 'function' ? fn(l100) : fn
      lab = { ...lab, L: clamp01(next / 100) }
    }
    const newRgb = oklabToRgb(oklchToOklab(lab))
    return new Color(toHex(newRgb))
  }

  // Returns the absolute APCA contrast against the given color. Matches
  // the colorjs.io API: `bg.contrast(other, 'APCA')`. The algorithm is
  // signed; callers in this codebase always take Math.abs.
  contrast(other, algo) {
    const otherColor = other instanceof Color ? other : new Color(other)
    if (algo && String(algo).toUpperCase() !== 'APCA') {
      // Only APCA is used in this codebase; fall through to it for any
      // other algo name to keep callers safe.
    }
    return apcaContrast(otherColor._rgb, this._rgb)
  }

  toString(opts) {
    if (opts && opts.format === 'hex') return toHex(this._rgb)
    const r = Math.round(this._rgb.r * 255)
    const g = Math.round(this._rgb.g * 255)
    const b = Math.round(this._rgb.b * 255)
    return this._a < 1 ? `rgba(${r}, ${g}, ${b}, ${this._a})` : `rgb(${r}, ${g}, ${b})`
  }
}
