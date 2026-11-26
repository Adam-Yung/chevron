import { PLACES } from './cityZones'
import { normaliseQuery } from './query'

const DAY_MS = 86_400_000
const FORMATTERS = new Map()

const CLOCK = String.raw`noon|midnight|\d{1,2}(?::\d{2})?(?: ?(?:am|pm))?`
const PLACE_LEAD = String.raw`(?:current |local )?time (?:in|at|for)|what time is it (?:in|at)|the time (?:in|at)`
const NOW_IN = new RegExp(`^(?:${PLACE_LEAD}) (.+)$`)
const PLACE_TIME = /^(.+?) (?:current |local )?time$/
const CONVERT = new RegExp(`^(${CLOCK}) (?:in |at )?(.+?) (?:to|in|into) (.+)$`)
const OFFSET = /^(?:utc|gmt) ?([+-]) ?(\d{1,2})(?::?(\d{2}))?$/
const IANA = /^[a-z]+(?:\/[a-z_]+){1,2}$/i

function formatterFor(zone) {
  let fmt = FORMATTERS.get(zone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    })
    FORMATTERS.set(zone, fmt)
  }
  return fmt
}

/** Wall-clock fields of an instant in a place (fixed-offset places shift UTC directly). */
function wallClock(place, ms) {
  if (place.fixedMinutes !== undefined) return fieldsFromUtc(ms + place.fixedMinutes * 60_000)
  const parts = {}
  for (const { type, value } of formatterFor(place.zone).formatToParts(ms)) parts[type] = Number(value)
  const hour = parts.hour % 24
  return { y: parts.year, mo: parts.month, d: parts.day, h: hour, mi: parts.minute, s: parts.second }
}

function fieldsFromUtc(ms) {
  const t = new Date(ms)
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds() }
}

function offsetMinutes(place, ms) {
  if (place.fixedMinutes !== undefined) return place.fixedMinutes
  const w = wallClock(place, ms)
  return (Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(ms / 1000) * 1000) / 60_000
}

/** Instant at which `place`'s wall clock reads the given date and time. Two passes settle DST changes. */
function instantAt(place, { y, mo, d, h, mi }) {
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const first = guess - offsetMinutes(place, guess) * 60_000
  return guess - offsetMinutes(place, first) * 60_000
}

function utcLabel(minutes) {
  if (minutes === 0) return 'UTC'
  const abs = Math.abs(minutes)
  const mm = abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''
  return `UTC${minutes < 0 ? '-' : '+'}${Math.floor(abs / 60)}${mm}`
}

function resolveOffset(text) {
  const m = OFFSET.exec(text)
  if (!m || Number(m[2]) > 14 || Number(m[3] ?? 0) > 59) return null
  const minutes = (Number(m[2]) * 60 + Number(m[3] ?? 0)) * (m[1] === '-' ? -1 : 1)
  return { name: utcLabel(minutes), fixedMinutes: minutes }
}

function resolveIana(text) {
  if (!IANA.test(text)) return null
  try {
    const zone = new Intl.DateTimeFormat('en-US', { timeZone: text }).resolvedOptions().timeZone
    return { name: text.split('/').pop().replace(/_/g, ' '), zone }
  } catch {
    return null
  }
}

/** @returns {{ name: string, zone?: string, fixedMinutes?: number }|null} */
function resolvePlace(raw) {
  const text = raw.replace(/^the /, '').replace(/\./g, '').trim()
  const known = PLACES.get(text) ?? PLACES.get(raw)
  return known ?? resolveOffset(text) ?? resolveIana(text)
}

function hourOf(hour, meridiem) {
  if (!meridiem) return hour <= 23 ? hour : null
  if (hour < 1 || hour > 12) return null
  return (hour % 12) + (meridiem === 'pm' ? 12 : 0)
}

function parseClock(text) {
  if (text === 'noon') return { h: 12, mi: 0, hour24: false }
  if (text === 'midnight') return { h: 0, mi: 0, hour24: false }
  const m = /^(\d{1,2})(?::(\d{2}))?(?: ?(am|pm))?$/.exec(text)
  if (!m || (!m[2] && !m[3])) return null // "3 london" is not a time
  const h = hourOf(Number(m[1]), m[3])
  const mi = Number(m[2] ?? 0)
  return h === null || mi > 59 ? null : { h, mi, hour24: !m[3] }
}

function formatClock({ h, mi }, hour24) {
  const mm = String(mi).padStart(2, '0')
  if (hour24) return `${String(h).padStart(2, '0')}:${mm}`
  return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'AM' : 'PM'}`
}

function dayShift(from, to) {
  const diff = (Date.UTC(to.y, to.mo - 1, to.d) - Date.UTC(from.y, from.mo - 1, from.d)) / DAY_MS
  if (diff === 0) return ''
  return diff > 0 ? ' (next day)' : ' (previous day)'
}

function describe(place, ms) {
  const offset = utcLabel(offsetMinutes(place, ms))
  return offset === place.name ? offset : `${place.name} (${offset})`
}

function currentTime(placeText, now) {
  const place = resolvePlace(placeText)
  if (!place) return null
  const ms = now()
  return {
    suggestion: formatClock(wallClock(place, ms), false),
    type: 'timezone',
    relevance: 5000,
    label: describe(place, ms),
  }
}

function convertTime(match, now) {
  const clock = parseClock(match[1])
  const from = resolvePlace(match[2])
  const to = resolvePlace(match[3])
  if (!clock || !from || !to) return null
  // The date is "today" where the typed time lives, so 3pm london means today's 3pm in London.
  const today = wallClock(from, now())
  const ms = instantAt(from, { ...today, h: clock.h, mi: clock.mi })
  const target = wallClock(to, ms)
  return {
    suggestion: formatClock(target, clock.hour24) + dayShift(today, target),
    type: 'timezone',
    relevance: 5000,
    label: `${formatClock(clock, clock.hour24)} ${describe(from, ms)} → ${describe(to, ms)}`,
  }
}

/**
 * Offline time zone answers through Intl: `time in tokyo`, `tokyo time`,
 * `3pm london to new york`, `15:00 utc in jst`, `noon pst to est`, `time in utc+5:30`.
 * Places come from a built-in table, IANA names and unambiguous abbreviations;
 * anything unknown gives no answer.
 * @param {string} query
 * @param {{ now?: () => number }} [options] clock injection for tests
 * @returns {import('./index').Answer|null}
 */
export function timezoneAnswer(query, { now = Date.now } = {}) {
  const q = normaliseQuery(query)
  const lead = NOW_IN.exec(q) ?? PLACE_TIME.exec(q)
  if (lead) return currentTime(lead[1], now)
  const conv = CONVERT.exec(q)
  return conv ? convertTime(conv, now) : null
}
