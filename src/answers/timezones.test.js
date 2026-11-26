import { describe, it, expect } from 'vitest'
import { timezoneAnswer } from './timezones'

const at = iso => ({ now: () => Date.parse(iso) })
const WINTER = at('2026-01-15T12:00:00Z')
const SUMMER = at('2026-07-15T12:00:00Z')

function show(query, options) {
  return timezoneAnswer(query, options)?.suggestion ?? null
}

describe('current time in a place', () => {
  it.each([
    ['time in tokyo', '9:00 PM'], ['Time in Tokyo', '9:00 PM'], ['tokyo time', '9:00 PM'], ['current time in tokyo', '9:00 PM'],
    ['what time is it in tokyo', '9:00 PM'], ['what time is it in tokyo?', '9:00 PM'], ['local time in tokyo', '9:00 PM'], ['time in japan', '9:00 PM'],
    ['time in london', '12:00 PM'], ['time in new york', '7:00 AM'], ['nyc time', '7:00 AM'], ['time in los angeles', '4:00 AM'],
    ['time in sf', '4:00 AM'], ['time in utc', '12:00 PM'], ['utc time', '12:00 PM'], ['gmt time', '12:00 PM'], ['time in pst', '4:00 AM'],
    ['time in est', '7:00 AM'], ['time in cet', '1:00 PM'], ['time in jst', '9:00 PM'], ['time in ist', '5:30 PM'], ['time in delhi', '5:30 PM'],
    ['time in mumbai', '5:30 PM'], ['time in sydney', '11:00 PM'], ['time in auckland', '1:00 AM'], ['time in dubai', '4:00 PM'],
    ['time in utc+5:45', '5:45 PM'], ['time in utc+9', '9:00 PM'], ['time in gmt-5', '7:00 AM'],
    ['time in utc - 3', '9:00 AM'], ['time in asia/tokyo', '9:00 PM'], ['time in america/new_york', '7:00 AM'], ['time in europe/paris', '1:00 PM'],
    ['time in the uk', '12:00 PM'], ['time in hong kong', '8:00 PM'], ['time in singapore', '8:00 PM'], ['time in sao paulo', '9:00 AM'],
    ['time in são paulo', '9:00 AM'], ['time in honolulu', '2:00 AM'], ['time in l.a.', '4:00 AM'], ['time in washington dc', '7:00 AM'],
  ])('winter: %s -> %s', (query, expected) => {
    expect(show(query, WINTER)).toBe(expected)
  })

  it.each([
    ['time in london', '1:00 PM'], ['time in new york', '8:00 AM'], ['time in pst', '5:00 AM'], ['time in paris', '2:00 PM'],
    ['time in sydney', '10:00 PM'], ['time in tokyo', '9:00 PM'], ['time in delhi', '5:30 PM'], ['time in utc', '12:00 PM'],
    ['time in phoenix', '5:00 AM'], ['time in dubai', '4:00 PM'], ['time in auckland', '12:00 AM'],
  ])('summer (daylight saving): %s -> %s', (query, expected) => {
    expect(show(query, SUMMER)).toBe(expected)
  })

  it('describes the place and its offset', () => {
    expect(timezoneAnswer('time in tokyo', WINTER)).toEqual({ suggestion: '9:00 PM', type: 'timezone', relevance: 5000, label: 'Tokyo (UTC+9)' })
    expect(timezoneAnswer('time in new york', SUMMER).label).toBe('New York (UTC-4)')
    expect(timezoneAnswer('time in delhi', SUMMER).label).toBe('Delhi (UTC+5:30)')
    expect(timezoneAnswer('time in utc', SUMMER).label).toBe('UTC')
  })

  it('formats midnight and noon as 12 AM and 12 PM', () => {
    expect(show('time in utc', at('2026-01-15T00:05:00Z'))).toBe('12:05 AM')
    expect(show('time in utc', at('2026-01-15T12:30:00Z'))).toBe('12:30 PM')
  })
})

describe('converting a time between places', () => {
  it.each([
    ['3pm london to new york', '10:00 AM'], ['3 pm london to new york', '10:00 AM'], ['3PM London in New York', '10:00 AM'], ['3:30pm london to tokyo', '12:30 AM (next day)'],
    ['15:00 utc in jst', '00:00 (next day)'], ['15:00 london to new york', '10:00'], ['noon pst to est', '3:00 PM'], ['midnight utc to tokyo', '9:00 AM'],
    ['9am tokyo to london', '12:00 AM'], ['9am tokyo to los angeles', '4:00 PM (previous day)'], ['6pm sydney to utc', '7:00 AM'], ['8:00 utc to delhi', '13:30'],
    ['3pm utc to utc+2', '5:00 PM'], ['3pm in london to paris', '4:00 PM'], ['3pm at london to paris', '4:00 PM'], ['11pm est to pst', '8:00 PM'],
    ['1am tokyo to london', '4:00 PM (previous day)'], ['10:30 am new york to mumbai', '9:00 PM'],
  ])('winter: %s -> %s', (query, expected) => {
    expect(show(query, WINTER)).toBe(expected)
  })

  it.each([
    ['3pm london to new york', '10:00 AM'], ['noon pst to est', '3:00 PM'], ['9am new york to tokyo', '10:00 PM'], ['3pm london to paris', '4:00 PM'],
    ['3pm london to sydney', '12:00 AM (next day)'], ['3pm pst to london', '11:00 PM'],
  ])('summer: %s -> %s', (query, expected) => {
    expect(show(query, SUMMER)).toBe(expected)
  })

  it('uses today in the source zone, so DST differences between the two places apply', () => {
    // 2026-03-15: US already on daylight time, UK not until 29 March.
    expect(show('3pm london to new york', at('2026-03-15T12:00:00Z'))).toBe('11:00 AM')
    expect(show('3pm london to new york', at('2026-03-30T12:00:00Z'))).toBe('10:00 AM')
  })

  it('takes the source date from the source zone', () => {
    // 23:30 UTC on 14 Jan is already 15 Jan in Tokyo.
    const lateUtc = at('2026-01-14T23:30:00Z')
    expect(show('noon tokyo to utc', lateUtc)).toBe('3:00 AM')
    expect(show('11pm utc to tokyo', lateUtc)).toBe('8:00 AM (next day)')
  })

  it('captions both ends', () => {
    expect(timezoneAnswer('3pm london to new york', WINTER).label).toBe('3:00 PM London (UTC) → New York (UTC-5)')
  })
})

describe('no answer', () => {
  it.each([
    '', 'time', 'time in', 'time in atlantis', 'time in the future', 'time in mars', 'hammer time', 'story time', 'what time is it', 'tokyo',
    'london', 'time in cst', 'time in usa', 'time in russia', 'time in australia', 'time in brazil', 'time in canada', 'time in utc+99',
    'time in utc+5:99', 'time in asia/nowhere', 'time in foo/bar', '3 london to tokyo', '3pm', '3pm london', '3pm to 5pm', '13pm london to tokyo',
    '0pm utc to jst', '25:00 utc to jst', '12:75 utc to jst', '3pm atlantis to london', '3pm london to atlantis', '3pm london to', 'how to center a div',
    'iphone 15', 'the 1975', '2024 calendar', 'c++ tutorial', '1080p', 'covid-19', 'windows 11', 'ps5', '5 km in miles', 'time in london and paris',
    'time in constructor', 'time in __proto__', 'what is the time in tokyo please',
  ])('%j', query => {
    expect(timezoneAnswer(query, WINTER)).toBeNull()
  })
})
