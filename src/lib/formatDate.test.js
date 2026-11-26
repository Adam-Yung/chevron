import { describe, it, expect } from 'vitest'
import formatDate from './formatDate'

const MORNING = new Date(2024, 0, 5, 9, 7, 3)
const AFTERNOON = new Date(2024, 11, 25, 15, 45, 30)
const MIDNIGHT = new Date(2024, 5, 1, 0, 0, 0)
const NOON = new Date(2024, 5, 1, 12, 0, 0)

describe('formatDate', () => {
  it.each([
    [MORNING, 'yyyy', '2024'], [MORNING, 'yy', '24'], [MORNING, 'HH', '09'], [MORNING, 'H', '9'], [MORNING, 'hh', '09'], [MORNING, 'h', '9'],
    [MORNING, 'MM', '01'], [MORNING, 'M', '1'], [MORNING, 'mm', '07'], [MORNING, 'm', '7'], [MORNING, 'ss', '03'], [MORNING, 's', '3'],
    [MORNING, 'dd', '05'], [MORNING, 'd', '5'], [MORNING, 'TT', 'AM'], [MORNING, 'tt', 'am'],
    [AFTERNOON, 'HH:mm', '15:45'], [AFTERNOON, 'hh:mm TT', '03:45 PM'], [AFTERNOON, 'h:mm tt', '3:45 pm'], [AFTERNOON, 'yyyy-MM-dd', '2024-12-25'],
    [AFTERNOON, 'dd/MM/yy', '25/12/24'], [AFTERNOON, 'HH:mm:ss', '15:45:30'], [AFTERNOON, 'M/d/yyyy', '12/25/2024'],
    [MIDNIGHT, 'h:mm TT', '12:00 AM'], [MIDNIGHT, 'HH', '00'], [NOON, 'h:mm TT', '12:00 PM'], [NOON, 'hh', '12'],
    [AFTERNOON, '"at" HH', 'at 15'], [AFTERNOON, "'Time:' HH:mm", 'Time: 15:45'], [AFTERNOON, 'HH"h"mm', '15h45'], [AFTERNOON, 'abc', 'abc'],
    [AFTERNOON, 'yyyyyy', '202424'], [AFTERNOON, 'HHH', '1515'], [AFTERNOON, '', ''], [AFTERNOON, undefined, ''], [AFTERNOON, null, ''],
    [AFTERNOON, '[HH]', '[15]'], [AFTERNOON, 'HH.mm', '15.45'], [AFTERNOON, "'yyyy'", 'yyyy'],
  ])('%s with %j -> %j', (date, format, expected) => {
    expect(formatDate(date, format)).toBe(expected)
  })
})
