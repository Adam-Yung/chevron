// Format tokens follow the `dateformat` package, so "Time format" strings saved by users keep
// working. Quoted segments ('text' or "text") are emitted literally.
const TOKEN_RE = /yyyy|yy|HH|H|hh|h|MM|M|mm|m|ss|s|dd|d|TT|tt|"[^"]*"|'[^']*'/g

const pad = n => String(n).padStart(2, '0')
const hour12 = d => ((d.getHours() + 11) % 12) + 1

const FORMATTERS = {
  yyyy: d => String(d.getFullYear()),
  yy: d => String(d.getFullYear()).slice(-2),
  HH: d => pad(d.getHours()),
  H: d => String(d.getHours()),
  hh: d => pad(hour12(d)),
  h: d => String(hour12(d)),
  MM: d => pad(d.getMonth() + 1),
  M: d => String(d.getMonth() + 1),
  mm: d => pad(d.getMinutes()),
  m: d => String(d.getMinutes()),
  ss: d => pad(d.getSeconds()),
  s: d => String(d.getSeconds()),
  dd: d => pad(d.getDate()),
  d: d => String(d.getDate()),
  TT: d => (d.getHours() < 12 ? 'AM' : 'PM'),
  tt: d => (d.getHours() < 12 ? 'am' : 'pm'),
}

export default function formatDate(date, format) {
  if (!format) return ''
  return String(format).replace(TOKEN_RE, token => {
    const quote = token[0]
    if (quote === '"' || quote === "'") return token.slice(1, -1)
    return FORMATTERS[token](date)
  })
}
