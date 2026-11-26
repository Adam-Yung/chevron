import { describe, it, expect } from 'vitest'
import { percentAnswer } from './percent'

describe('percentAnswer', () => {
  it.each([
    ['15% of 80', '12'], ['what is 15% of 80', '12'], ["what's 15% of 80", '12'], ['15 percent of 80', '12'],
    ['15 pct of 80', '12'], ['15%of80', null], ['15 % of 80', '12'], ['What is 15% of 80?', '12'],
    ['0.5% of 200', '1'], ['.5% of 200', '1'], ['100% of 7', '7'], ['200% of 7', '14'], ['12.5% of 8', '1'],
    ['1,000% of 1', '10'], ['15% of 1,000', '150'], ['33% of 100', '33'], ['7.5% of 33', '2.475'],
    ['20% off 80', '64'], ['20 percent off 100', '80'], ['100% off 5', '0'], ['15% off 19.99', '16.9915'],
    ['20 is what percent of 80', '25%'], ['what percent of 80 is 20', '25%'], ['1 is what % of 3', '33.33333333%'],
    ['50 is what percent of 25', '200%'], ['0 is what percent of 5', '0%'], ['what percent of 50 is 10', '20%'],
  ])('%s -> %s', (query, expected) => {
    const answer = percentAnswer(query)
    if (expected === null) return expect(answer).toBeNull()
    expect(answer.suggestion).toBe(expected)
    expect(answer.type).toBe('percent')
    expect(answer.relevance).toBe(5000)
  })

  it.each([
    '5 is what percent of 0', 'what percent of 0 is 5', '', '15% of', '% of 80', 'of 80', 'percent of americans',
    'how much is 15 of 80', '15% off', '50 percent', 'what is a percent of 5', 'x% of 5', '15% of eighty', 'the 15% of 80 rule',
    'pct of 3', '80 + 15%', '15% of 80 and 5',
  ])('no answer for %j', query => {
    expect(percentAnswer(query)).toBeNull()
  })

  it('captions the phrase', () => {
    expect(percentAnswer('15% of 80').label).toBe('15% of 80')
    expect(percentAnswer('20% off 80').label).toBe('80 less 20%')
  })
})
