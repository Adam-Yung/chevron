// Tiny dateformat-compatible formatter. Replaces the `dateformat` npm
// dep (~3 KB minified + Date polyfills it pulled along) with a ~30-line
// helper that handles the tokens this app actually exposes via the
// "Time format" setting. Token semantics intentionally match the
// `dateformat` package so users with custom format strings see the
// same output as before.
//
// Supported tokens (a strict subset of `dateformat`):
//   yyyy / yy   four / two digit year
//   HH / H      24-hour clock, padded / not padded
//   hh / h      12-hour clock, padded / not padded
//   MM / M      month (1-12), padded / not padded
//   mm / m      minutes, padded / not padded
//   ss / s      seconds, padded / not padded
//   dd / d      day of month, padded / not padded
//   TT / tt     AM/PM marker (uppercase / lowercase)
// Quoted segments inside "double" or 'single' quotes are emitted literally.

const TOKEN_RE = /yyyy|yy|HH|H|hh|h|MM|M|mm|m|ss|s|dd|d|TT|tt|"[^"]*"|'[^']*'/g

function pad(n) { return n < 10 ? '0' + n : '' + n }

export default function formatDate(date, format) {
  if (!format) return ''
  return String(format).replace(TOKEN_RE, (match) => {
    if (match[0] === '"' || match[0] === "'") return match.slice(1, -1)
    const h24 = date.getHours()
    const h12 = ((h24 + 11) % 12) + 1
    switch (match) {
      case 'yyyy': return '' + date.getFullYear()
      case 'yy':   return ('' + date.getFullYear()).slice(-2)
      case 'HH':   return pad(h24)
      case 'H':    return '' + h24
      case 'hh':   return pad(h12)
      case 'h':    return '' + h12
      case 'MM':   return pad(date.getMonth() + 1)
      case 'M':    return '' + (date.getMonth() + 1)
      case 'mm':   return pad(date.getMinutes())
      case 'm':    return '' + date.getMinutes()
      case 'ss':   return pad(date.getSeconds())
      case 's':    return '' + date.getSeconds()
      case 'dd':   return pad(date.getDate())
      case 'd':    return '' + date.getDate()
      case 'TT':   return h24 < 12 ? 'AM' : 'PM'
      case 'tt':   return h24 < 12 ? 'am' : 'pm'
      default:     return match
    }
  })
}
