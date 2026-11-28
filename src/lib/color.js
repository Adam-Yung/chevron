// The few colorjs.io operations Chevron uses: hex/rgb parsing, APCA contrast, OKLCH lightness. Details in docs/code.

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
  // Named colours and other CSS syntaxes are resolved by the browser through a throwaway node.
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

// sRGB <-> linear sRGB <-> OKLab <-> OKLCH (Björn Ottosson's OKLab formulas, unchanged)

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

// APCA contrast, simplified sRGB path (public-domain math: https://github.com/Myndex/SAPC-APCA).

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

// Public Color class

export default class Color {
  constructor(input) {
    const rgb = parseColor(input)
    if (!rgb) throw new Error('Could not parse color: ' + input)
    this._rgb = { r: rgb.r, g: rgb.g, b: rgb.b }
    this._a = rgb.a == null ? 1 : rgb.a
  }

  static parse(input) {
    return new Color(input)
  }

  // Only { 'lch.l': number or function } is supported: OKLCH lightness on colorjs.io's 0..100 scale.
  set(spec) {
    let lab = oklabToOklch(rgbToOklab(this._rgb))
    if ('lch.l' in spec) {
      const fn = spec['lch.l']
      const l100 = lab.L * 100
      const next = typeof fn === 'function' ? fn(l100) : fn
      lab = { ...lab, L: clamp01(next / 100) }
    }
    const newRgb = oklabToRgb(oklchToOklab(lab))
    return new Color(toHex(newRgb))
  }

  // APCA only: the algorithm name callers still pass is ignored. Signed by polarity.
  contrast(other) {
    const otherColor = other instanceof Color ? other : new Color(other)
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
