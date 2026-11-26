// Unit data only. `factor` converts to the family's base unit; units that are not a plain
// scale (temperature) give `toBase` / `fromBase` instead. Aliases are matched after
// lower-casing, collapsing spaces and rewriting `²`, `^2` and `.` (see normaliseUnit).
// Bytes use SI prefixes (KB = 1000) and the binary ones are explicit (KiB = 1024).
// Case-insensitive matching means kb/mb/gb are bytes; bits need the word or kbit/mbit/gbit.

const celsius = { toBase: v => v, fromBase: v => v }

export const FAMILIES = {
  length: {
    base: 'm',
    units: {
      mm: { factor: 0.001, aliases: ['millimeter', 'millimeters', 'millimetre', 'millimetres'] },
      cm: { factor: 0.01, aliases: ['centimeter', 'centimeters', 'centimetre', 'centimetres'] },
      m: { factor: 1, aliases: ['meter', 'meters', 'metre', 'metres'] },
      km: { factor: 1000, aliases: ['kms', 'kilometer', 'kilometers', 'kilometre', 'kilometres'] },
      in: { factor: 0.0254, aliases: ['inch', 'inches'] },
      ft: { factor: 0.3048, aliases: ['foot', 'feet'] },
      yd: { factor: 0.9144, aliases: ['yard', 'yards'] },
      mi: { factor: 1609.344, aliases: ['mile', 'miles'] },
      nmi: { factor: 1852, aliases: ['nautical mile', 'nautical miles'] },
    },
  },
  weight: {
    base: 'g',
    units: {
      mg: { factor: 0.001, aliases: ['milligram', 'milligrams'] },
      g: { factor: 1, aliases: ['gram', 'grams', 'gramme', 'grammes'] },
      kg: { factor: 1000, aliases: ['kilo', 'kilos', 'kilogram', 'kilograms', 'kilogramme', 'kilogrammes'] },
      t: { factor: 1_000_000, aliases: ['tonne', 'tonnes', 'metric ton', 'metric tons'] },
      oz: { factor: 28.349523125, aliases: ['ounce', 'ounces'] },
      lb: { factor: 453.59237, aliases: ['lbs', 'pound', 'pounds'] },
      st: { factor: 6350.29318, aliases: ['stone', 'stones'] },
      'short ton': { factor: 907184.74, aliases: ['shortton', 'short tons', 'us ton', 'us tons', 'ton', 'tons'] },
    },
  },
  duration: {
    base: 'ms',
    units: {
      ms: { factor: 1, aliases: ['millisecond', 'milliseconds', 'millis'] },
      s: { factor: 1000, aliases: ['second', 'seconds', 'sec', 'secs'] },
      min: { factor: 60_000, aliases: ['minute', 'minutes', 'mins'] },
      h: { factor: 3_600_000, aliases: ['hour', 'hours', 'hr', 'hrs'] },
      d: { factor: 86_400_000, aliases: ['day', 'days'] },
      w: { factor: 604_800_000, aliases: ['week', 'weeks', 'wk', 'wks'] },
      // Months and years are averages (30.4375 and 365.25 days).
      month: { factor: 2_629_800_000, aliases: ['months', 'mo', 'mos'] },
      yr: { factor: 31_557_600_000, aliases: ['year', 'years', 'y', 'yrs'] },
    },
  },
  temperature: {
    base: 'c',
    units: {
      '°C': { ...celsius, aliases: ['c', 'celsius', 'centigrade', 'degc', 'deg c', 'degrees c', 'degrees celsius', 'degree celsius'] },
      '°F': {
        toBase: v => ((v - 32) * 5) / 9,
        fromBase: v => (v * 9) / 5 + 32,
        aliases: ['f', 'fahrenheit', 'degf', 'deg f', 'degrees f', 'degrees fahrenheit', 'degree fahrenheit'],
      },
      K: { toBase: v => v - 273.15, fromBase: v => v + 273.15, aliases: ['kelvin', 'kelvins', '°k'] },
    },
  },
  volume: {
    base: 'ml',
    units: {
      ml: { factor: 1, aliases: ['milliliter', 'milliliters', 'millilitre', 'millilitres'] },
      l: { factor: 1000, aliases: ['liter', 'liters', 'litre', 'litres'] },
      tsp: { factor: 4.92892159375, aliases: ['teaspoon', 'teaspoons'] },
      tbsp: { factor: 14.78676478125, aliases: ['tablespoon', 'tablespoons'] },
      'fl oz': { factor: 29.5735295625, aliases: ['floz', 'fluid ounce', 'fluid ounces'] },
      cup: { factor: 236.5882365, aliases: ['cups'] },
      pint: { factor: 473.176473, aliases: ['pints', 'pt'] },
      quart: { factor: 946.352946, aliases: ['quarts', 'qt'] },
      gallon: { factor: 3785.411784, aliases: ['gallons', 'gal'] },
    },
  },
  area: {
    base: 'm²',
    units: {
      'm²': { factor: 1, aliases: ['sqm', 'sq m', 'square meter', 'square meters', 'square metre', 'square metres'] },
      'km²': { factor: 1e6, aliases: ['sqkm', 'sq km', 'square kilometer', 'square kilometers', 'square kilometre', 'square kilometres'] },
      'ft²': { factor: 0.09290304, aliases: ['sqft', 'sq ft', 'square foot', 'square feet'] },
      acre: { factor: 4046.8564224, aliases: ['acres'] },
      hectare: { factor: 10_000, aliases: ['hectares', 'ha'] },
    },
  },
  speed: {
    base: 'm/s',
    units: {
      'm/s': { factor: 1, aliases: ['mps', 'meters per second', 'metres per second'] },
      'km/h': { factor: 1 / 3.6, aliases: ['kph', 'kmh', 'kmph', 'kilometers per hour', 'kilometres per hour'] },
      mph: { factor: 0.44704, aliases: ['miles per hour'] },
      'ft/s': { factor: 0.3048, aliases: ['fps', 'feet per second'] },
      knot: { factor: 1852 / 3600, aliases: ['knots', 'kn', 'kt', 'kts'] },
    },
  },
  data: {
    base: 'byte',
    units: {
      bit: { factor: 0.125, aliases: ['bits'] },
      byte: { factor: 1, aliases: ['bytes'] },
      kbit: { factor: 125, aliases: ['kilobit', 'kilobits'] },
      mbit: { factor: 125_000, aliases: ['megabit', 'megabits'] },
      gbit: { factor: 125_000_000, aliases: ['gigabit', 'gigabits'] },
      KB: { factor: 1e3, aliases: ['kilobyte', 'kilobytes'] },
      MB: { factor: 1e6, aliases: ['megabyte', 'megabytes'] },
      GB: { factor: 1e9, aliases: ['gigabyte', 'gigabytes'] },
      TB: { factor: 1e12, aliases: ['terabyte', 'terabytes'] },
      PB: { factor: 1e15, aliases: ['petabyte', 'petabytes'] },
      KiB: { factor: 1024, aliases: ['kibibyte', 'kibibytes'] },
      MiB: { factor: 1024 ** 2, aliases: ['mebibyte', 'mebibytes'] },
      GiB: { factor: 1024 ** 3, aliases: ['gibibyte', 'gibibytes'] },
      TiB: { factor: 1024 ** 4, aliases: ['tebibyte', 'tebibytes'] },
    },
  },
}
