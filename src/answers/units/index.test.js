import { describe, it, expect } from 'vitest'
import { convertUnits, unitAnswer } from './index'

function show(query) {
  return unitAnswer(query)?.suggestion ?? null
}

describe('unitAnswer: conversions', () => {
  it.each([
    // length
    ['1 km in m', '1000 m'], ['5 ft in cm', '152.4 cm'], ['1 mile to km', '1.609344 km'], ['10 mi in km', '16.09344 km'],
    ['100 cm to in', '39.370079 in'], ['1 yd in ft', '3 ft'], ['12 inches to feet', '1 ft'], ['1 nmi in km', '1.852 km'],
    ['1 nautical mile to m', '1852 m'], ['1000 mm in m', '1 m'], ['5km to miles', '3.106856 mi'], ['6 feet in meters', '1.8288 m'],
    ['5 in to cm', '12.7 cm'], ['5 in in cm', '12.7 cm'], ['1 meter in yards', '1.0936133 yd'], ['2.5 km in ft', '8202.0997 ft'],
    ['1 m to mm', '1000 mm'], ['26.2 mi in km', '42.164813 km'], ['0 km in m', '0 m'], ['-5 m in cm', '-500 cm'], ['1,000 m in km', '1 km'],
    // weight (legacy behaviour kept)
    ['100 kg in lb', '220.46226 lb'], ['5 ounces to grams', '141.74762 g'], ['1 lb in oz', '16 oz'], ['1 kg to g', '1000 g'],
    ['2 stone in kg', '12.700586 kg'], ['1 tonne in kg', '1000 kg'], ['1 t to kg', '1000 kg'], ['500 mg to g', '0.5 g'],
    ['1 short ton in lb', '2000 lb'], ['10 pounds in kg', '4.5359237 kg'], ['1 kilo in g', '1000 g'], ['100 lbs to kg', '45.359237 kg'],
    // duration (legacy behaviour kept)
    ['2h in min', '120 min'], ['90 minutes to hours', '1.5 h'], ['1d in seconds', '86400 s'], ['1.5 days in hours', '36 h'],
    ['1 week in days', '7 d'], ['1 year in days', '365.25 d'], ['1 hour in ms', '3600000 ms'], ['60 sec to min', '1 min'],
    ['1 month in days', '30.4375 d'], ['2 years in weeks', '104.35714 w'], ['3600 s in h', '1 h'], ['1 day in hrs', '24 h'],
    // temperature
    ['100 c in f', '212 °F'], ['32 f to c', '0 °C'], ['0 k in c', '-273.15 °C'], ['273.15 k to c', '0 °C'], ['0 c to k', '273.15 K'],
    ['100 °C to °F', '212 °F'], ['100 celsius to fahrenheit', '212 °F'], ['98.6 fahrenheit in celsius', '37 °C'], ['-40 c in f', '-40 °F'],
    ['-40 f in c', '-40 °C'], ['300 kelvin to celsius', '26.85 °C'], ['20 degrees celsius in fahrenheit', '68 °F'], ['72 f in k', '295.37222 K'],
    ['37 deg c to f', '98.6 °F'], ['0 f in k', '255.37222 K'], ['25 C to F', '77 °F'],
    // volume
    ['1 l in ml', '1000 ml'], ['1 gallon in l', '3.7854118 l'], ['1 cup in ml', '236.58824 ml'], ['3 tsp in tbsp', '1 tbsp'],
    ['1 tbsp to ml', '14.786765 ml'], ['16 fl oz in pint', '1 pint'], ['2 pints to quarts', '1 quart'], ['4 quarts in gallons', '1 gallon'],
    ['1 liter to cups', '4.2267528 cup'], ['500 ml to fl oz', '16.907011 fl oz'], ['1 gal in qt', '4 quart'], ['1 fl. oz in ml', '29.57353 ml'],
    ['2 litres in ml', '2000 ml'], ['8 floz to cup', '1 cup'],
    // area
    ['1 km2 in m2', '1000000 m²'], ['1 acre in m2', '4046.8564 m²'], ['1 hectare in acres', '2.4710538 acre'], ['10 m2 to ft2', '107.6391 ft²'],
    ['1 hectare to m²', '10000 m²'], ['100 sq ft in m2', '9.290304 m²'], ['1 sqkm in hectares', '100 hectare'], ['1 square mile in acres', null],
    ['1 square meter to square feet', '10.76391 ft²'], ['5 ha in m^2', '50000 m²'],
    // speed
    ['60 mph in km/h', '96.56064 km/h'], ['100 kph to mph', '62.137119 mph'], ['1 m/s in km/h', '3.6 km/h'], ['10 knots in mph', '11.507794 mph'],
    ['100 km/h in m/s', '27.777778 m/s'], ['1 knot to km/h', '1.852 km/h'], ['30 mph to knots', '26.069287 knot'], ['100 kmh to mph', '62.137119 mph'],
    ['1 mps in kph', '3.6 km/h'],
    // data
    ['1 gb in mb', '1000 MB'], ['1 gib in mib', '1024 MiB'], ['1 tb in gb', '1000 GB'], ['1 tib in gib', '1024 GiB'], ['8 bits in bytes', '1 byte'],
    ['1 byte to bits', '8 bit'], ['1 kb in bytes', '1000 byte'], ['1 kib in bytes', '1024 byte'], ['1024 mb in gb', '1.024 GB'], ['1 mb to kb', '1000 KB'],
    ['1 tib in bytes', '1099511627776 byte'], ['1 megabyte in kilobytes', '1000 KB'], ['1 gbit in mbit', '1000 mbit'], ['1 pb to tb', '1000 TB'],
    ['100 mb to gib', '0.093132257 GiB'],
  ])('%s -> %s', (query, expected) => {
    expect(show(query)).toBe(expected)
  })
})

describe('unitAnswer: tolerance', () => {
  it.each([
    '5km in mi', '5 KM IN MI', '  5   km   to   mi  ', '5 km to mi?', 'convert 5 km to mi', 'what is 5 km in mi', '5 kilometers in miles', '5 kilometres to miles',
    '5 km into mi', '5 km as mi', '+5 km in mi',
  ])('%j', query => {
    expect(show(query)).toBe('3.106856 mi')
  })

  it('captions with the source amount and unit', () => {
    expect(unitAnswer('5 ft in cm')).toEqual({ suggestion: '152.4 cm', type: 'unit', relevance: 5000, label: '5 ft' })
  })
})

describe('unitAnswer: must not answer', () => {
  it.each([
    '5 ft', '5 km', 'km to mi', 'kg to lb', 'how many feet in a mile', '5 km in', '5 km to nowhere', '5 foo to bar', 'kg', '5',
    '5 km in kg', '5 kg in c', '1 gb in km', '10 c in m', '1 l in kg', '1 mph in mb', '100 f to kg',
    '-1 k to c', '-300 c to f', '-500 c in k', 'iphone 15 to 16', 'windows 10 to windows 11', 'react to vue', 'how to center a div',
    '1080p to 4k', 'ps4 to ps5', '5 pm to 7 pm', '3pm london to tokyo', '1975 to 2024', '5 km in miles and feet', '2024 in review',
    '5 in', '5 in in', '1e400 km in m', '5 km in m extra words here', 'the 1975', 'c++ to rust', '10 apples to oranges', '5 hex to dec',
    '100 usd to eur', '5 kb in kib mb',
  ])('%j', query => {
    expect(unitAnswer(query)).toBeNull()
  })

  it('never answers beyond absolute zero', () => {
    expect(convertUnits('-273.16 c in k')).toBeNull()
    expect(convertUnits('-273.15 c in k').result).toBeCloseTo(0, 10)
  })
})

describe('convertUnits', () => {
  it('reports the family so wrappers can restrict it', () => {
    expect(convertUnits('1 kg in g').family).toBe('weight')
    expect(convertUnits('1 kg in g', ['duration'])).toBeNull()
    expect(convertUnits('1 h in min', ['duration']).family).toBe('duration')
  })

  it('resolves an alias to the family both sides share', () => {
    expect(convertUnits('1 pt in cup').family).toBe('volume')
    expect(convertUnits('1 m in ft').family).toBe('length')
    expect(convertUnits('1 min in s').family).toBe('duration')
  })
})
