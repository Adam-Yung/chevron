import { describe, it, expect } from 'vitest'
import { ANSWER_TYPES, instantAnswers, looksLikeCurrency } from './index'
import { formatNumber } from './format'

const NOW = { now: () => Date.parse('2026-01-15T12:00:00Z') }

describe('instantAnswers: routing', () => {
  it.each([
    ['2+2', 'calculator', '4'], ['sqrt(16) * 2', 'calculator', '8'], ['80 + 15%', 'calculator', '92'], ['15% of 80', 'percent', '12'],
    ['what is 15% of 80', 'percent', '12'], ['100 kg in lb', 'unit', '220.46226 lb'], ['5 ft in cm', 'unit', '152.4 cm'], ['100 f to c', 'unit', '37.777778 °C'],
    ['255 in hex', 'base', '0xff'], ['0b1010 to dec', 'base', '10'], ['time in tokyo', 'timezone', '9:00 PM'], ['3pm london to new york', 'timezone', '10:00 AM'],
    ['2 hours in minutes', 'unit', '120 min'],
  ])('%s -> %s', (query, type, suggestion) => {
    const answers = instantAnswers(query, NOW)
    expect(answers).toHaveLength(1)
    expect(answers[0]).toMatchObject({ type, suggestion, relevance: 5000 })
  })

  it('declares every type it can produce', () => {
    const produced = ['2+2', '15% of 80', '1 km in m', '255 in hex', 'time in tokyo'].map(q => instantAnswers(q, NOW)[0].type)
    for (const type of produced) expect(ANSWER_TYPES).toContain(type)
    expect(ANSWER_TYPES).toContain('currency')
  })

  it('re-exports the currency gate', () => {
    expect(looksLikeCurrency('100 usd to eur')).toBe(true)
    expect(looksLikeCurrency('2+2')).toBe(false)
  })

  it('gives every answer the documented shape', () => {
    for (const q of ['2+2', '15% of 80', '1 km in m', '255 in hex', 'time in tokyo']) {
      const [answer] = instantAnswers(q, NOW)
      expect(typeof answer.suggestion).toBe('string')
      expect(typeof answer.type).toBe('string')
      expect(typeof answer.relevance).toBe('number')
      expect(typeof answer.label).toBe('string')
    }
  })
})

// An answer card on an ordinary search is a distraction: these must stay silent.
describe('instantAnswers: ordinary searches get no card', () => {
  it.each([
    'how to center a div', 'iphone 15', 'the 1975', '2024 calendar', 'c++ tutorial', '1080p', 'covid-19', 'windows 11', 'ps5', 'ps4 vs ps5',
    '42', 'pi', 'e', '3.14', '100%', '-5', 'hello', 'hello world', 'github', 'youtube', 'weather', 'weather in tokyo', 'tokyo', 'london', 'time',
    'react 18', 'node 20', 'python 3.12', 'ubuntu 22.04', 'macbook pro m3', 'rtx 4090', 'gpt-4', 'gpt 4o', 'catch-22', '24/7', '9/11', '2020-2021',
    '2024-11-25', '555-1234', 'mp3 to wav', 'mp4 to gif', 'jpg to png', 'pdf to word', 'js to ts', 'css grid', 'a/b testing', 'x86 vs arm',
    '1 on 1 meeting', '5 star hotels', '3d printer', '4k tv', '8k monitor', 'top 10 movies', '10 things i hate about you', '7 days to die',
    'what is love', 'what is a prime number', 'how many feet in a mile', 'cm to inches', 'kg to lbs', 'celsius to fahrenheit', 'usd to eur',
    'sin city', 'cos theta', 'log in', 'log out', 'ln -s', 'exp', 'abs workout', 'round table', 'floor plan', 'ceil', 'e commerce', 'pi day',
    'x men', 'x', 'in', 'to', 'in to', '()', '!', '%', '!!', '+', '-', '*', '/', '^', '...', '??', '= =', '~', '#', '@', '1 2 3', '1,2,3',
    'a+b', 'x+y', 'c++', 'c#', 'f#', '.net', 'node.js', 'vue.js', 'three.js', 'win+r', 'ctrl+c', 'ctrl+alt+del', 'alt+f4', 'f1', 'f12',
    'm1 vs m2', 'm2 macbook', 'usb 3.0', 'wifi 6', '802.11ac', 'h264', 'h.265', 'x264', 'x265', 'av1', 'vp9', 'cat5', 'cat6', 'rj45', 'i7 13700k',
    'ryzen 5 5600x', 'r5 5600', 'a12 bionic', 'galaxy s24', 'pixel 8', 'xbox 360', 'ps2', 'n64', 'gba', 'psp', 'nes', 'snes', 'ds lite',
    'hr department', 'min wage', 'max payne', 'sec filings', 'mon to fri', 'am to pm', 'am i the asshole', 'pm modi', 'ft worth', 'oz the wizard',
    'lb', 'kg', 'gal gadot', 'cup noodles', 'pint of guinness', 'acre', 'tbsp', 'liter', 'knot', 'mph', 'kph', 'ha ha', 'mi casa', 'in n out',
    'time to eat', 'time for bed', 'time in a bottle', 'time after time', 'summer time', 'prime time', 'lunch time', 'bed time', 'tea time',
    'hammer time', 'cat in the hat', 'in the mood', 'back to the future', 'ready to go', 'to be or not to be', 'how to', 'up to date', 'face to face',
  ])('%j', query => {
    expect(instantAnswers(query, NOW)).toEqual([])
  })

  it('never throws on odd input', () => {
    for (const q of [undefined, null, 0, NaN, {}, [], '', ' ', '\n', '\u0000', 'a'.repeat(100_000), '(('.repeat(10_000), '9'.repeat(5_000) + ' in hex', '😀 + 😀']) {
      expect(() => instantAnswers(q, NOW)).not.toThrow()
      expect(Array.isArray(instantAnswers(q, NOW))).toBe(true)
    }
  })

  it('is fast on a long near-miss query', () => {
    const start = performance.now()
    for (let i = 0; i < 200; i++) instantAnswers('how to center a div inside another div with css flexbox grid or something else', NOW)
    expect(performance.now() - start).toBeLessThan(500)
  })
})

describe('formatNumber', () => {
  it.each([
    [0.1 + 0.2, undefined, '0.3'], [1 / 3, undefined, '0.33333333'], [1 / 3, 4, '0.3333'], [1099511627776, undefined, '1099511627776'],
    [NaN, undefined, ''], [Infinity, undefined, ''], [-0, undefined, '0'], [1e21, undefined, '1e+21'], [12.5, undefined, '12.5'],
    [2 ** 49, undefined, '562949953421312'], [1.0000000000001, undefined, '1'], [123456.789, 4, '123500'],
  ])('%s (%s) -> %s', (value, sig, text) => {
    expect(formatNumber(value, sig)).toBe(text)
  })
})
