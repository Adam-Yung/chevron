// Meteocons (meteocons.com) inline SVGs with SMIL animation: the browser animates them natively, with no JS running per frame.
// OWM codes pair a condition (01-50) with d/n; clouds and weather types share an icon between day and night where the set has no variant.

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

// Several copies of one icon can be on the page (chip, modal, forecast); duplicate ids would make gradients and clips
// reference the wrong copy, so ids are suffixed per instance.
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

/** Map an OWM icon code to the animated scene behind the modal hero. */
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
