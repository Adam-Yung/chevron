/**
 * Animated weather icons powered by Meteocons (https://meteocons.com).
 *
 * Each icon is an inline SVG with SMIL animations — native browser animation
 * with no JS runtime. IDs are randomised per instance to prevent clashes
 * when the same icon appears multiple times on one page.
 *
 * OWM icon codes → meteocon mapping:
 *   01d/n  clear sky        → clear-day / clear-night
 *   02d/n  few clouds       → partly-cloudy-day / partly-cloudy-night
 *   03d/n  scattered clouds → partly-cloudy-day / partly-cloudy-night
 *   04d/n  broken/overcast  → overcast
 *   09d/n  shower rain      → drizzle
 *   10d/n  rain             → rain
 *   11d/n  thunderstorm     → thunderstorms
 *   13d/n  snow             → snow
 *   50d/n  mist/fog         → fog
 */

import clearDaySvg from '@meteocons/svg/fill/clear-day.svg?raw'
import clearNightSvg from '@meteocons/svg/fill/clear-night.svg?raw'
import partlyCloudyDaySvg from '@meteocons/svg/fill/partly-cloudy-day.svg?raw'
import partlyCloudyNightSvg from '@meteocons/svg/fill/partly-cloudy-night.svg?raw'
import overcastSvg from '@meteocons/svg/fill/overcast.svg?raw'
import drizzleSvg from '@meteocons/svg/fill/drizzle.svg?raw'
import rainSvg from '@meteocons/svg/fill/rain.svg?raw'
import thunderstormsSvg from '@meteocons/svg/fill/thunderstorms.svg?raw'
import snowSvg from '@meteocons/svg/fill/snow.svg?raw'
import fogSvg from '@meteocons/svg/fill/fog.svg?raw'

import { useId, useMemo } from 'react'

const CODE_TO_SVG = {
  '01d': clearDaySvg,
  '01n': clearNightSvg,
  '02d': partlyCloudyDaySvg,
  '02n': partlyCloudyNightSvg,
  '03d': partlyCloudyDaySvg,
  '03n': partlyCloudyNightSvg,
  '04d': overcastSvg,
  '04n': overcastSvg,
  '09d': drizzleSvg,
  '09n': drizzleSvg,
  '10d': rainSvg,
  '10n': rainSvg,
  '11d': thunderstormsSvg,
  '11n': thunderstormsSvg,
  '13d': snowSvg,
  '13n': snowSvg,
  '50d': fogSvg,
  '50n': fogSvg,
}

function uniquifySvg(svgString, uid) {
  return svgString.replace(/\bid="([^"]+)"/g, `id="$1-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`)
    .replace(/href="#([^"]+)"/g, `href="#$1-${uid}"`)
}

export function WeatherIcon({ code, size = 32 }) {
  const uid = useId()
  const svgRaw = CODE_TO_SVG[code]

  const html = useMemo(() => svgRaw ? uniquifySvg(svgRaw, uid) : null, [svgRaw, uid])

  if (!html) return null

  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Map an OWM icon code to a scene type for the modal background.
 */
export function iconToScene(code) {
  if (!code) return 'sunny'
  const prefix = code.slice(0, 2)
  const isNight = code.endsWith('n')
  switch (prefix) {
    case '01': return isNight ? 'night' : 'sunny'
    case '02':
    case '03': return 'partly-cloudy'
    case '04': return 'cloudy'
    case '09': return 'heavy-rain'
    case '10': return 'rain'
    case '11': return 'storm'
    case '13': return 'snow'
    case '50': return 'fog'
    default:   return 'sunny'
  }
}
