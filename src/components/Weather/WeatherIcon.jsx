/**
 * Animated SVG weather icons.
 *
 * Each icon is a self-contained <svg> with embedded <style> keyframes so
 * it works anywhere without global CSS. All animations respect
 * prefers-reduced-motion via a media query inside each <style> block.
 *
 * Usage:
 *   <WeatherIcon code="01d" size={48} />
 *
 * OWM icon codes → condition mapping:
 *   01d/n  clear sky
 *   02d/n  few clouds
 *   03d/n  scattered clouds
 *   04d/n  broken/overcast clouds
 *   09d/n  shower rain
 *   10d/n  rain
 *   11d/n  thunderstorm
 *   13d/n  snow
 *   50d/n  mist/fog
 */

/* ─── Sun ─────────────────────────────────────────────────────────────── */
function IconSun({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-spin { to { transform: rotate(360deg); transform-origin: 24px 24px; } }
        @keyframes wi-pulse { 0%,100% { opacity:.85 } 50% { opacity:1 } }
        @media (prefers-reduced-motion: reduce) {
          .wi-rays, .wi-glow { animation: none !important; }
        }
      `}</style>
      {/* glow */}
      <circle cx="24" cy="24" r="14" fill="#FBBF24" opacity=".18" className="wi-glow"
        style={{ animation: 'wi-pulse 3s ease-in-out infinite' }}/>
      {/* rays */}
      <g className="wi-rays" style={{ animation: 'wi-spin 12s linear infinite', transformOrigin: '24px 24px' }}>
        {[0,45,90,135,180,225,270,315].map(deg => (
          <line key={deg}
            x1="24" y1="4" x2="24" y2="9"
            stroke="#FCD34D" strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${deg} 24 24)`}/>
        ))}
      </g>
      {/* disc */}
      <circle cx="24" cy="24" r="9" fill="#FBBF24"/>
    </svg>
  )
}

/* ─── Moon ────────────────────────────────────────────────────────────── */
function IconMoon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-stars { 0%,100% { opacity:.3 } 50% { opacity:1 } }
        @media (prefers-reduced-motion: reduce) {
          .wi-star { animation: none !important; opacity:.6 !important; }
        }
      `}</style>
      {/* stars */}
      {[[9,10,1.4,0],[36,8,1,0.8],[38,28,1.1,1.6],[10,34,0.9,2.2]].map(([cx,cy,r,delay],i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#E5E7EB" className="wi-star"
          style={{ animation: `wi-stars 2.5s ease-in-out ${delay}s infinite` }}/>
      ))}
      {/* crescent */}
      <path
        d="M30 12a13 13 0 1 0 0 24 10 10 0 1 1 0-24z"
        fill="#FCD34D"/>
    </svg>
  )
}

/* ─── Partly Cloudy (day) ─────────────────────────────────────────────── */
function IconPartlyCloudyDay({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
        @keyframes wi-sunpeek { 0%,100% { opacity:.9 } 50% { opacity:1 } }
        @media (prefers-reduced-motion: reduce) {
          .wi-cloud-bob, .wi-sunray-peek { animation: none !important; }
        }
      `}</style>
      {/* sun behind */}
      <g className="wi-sunray-peek" style={{ animation: 'wi-sunpeek 3s ease-in-out infinite' }}>
        {[0,45,90,135,180,225,270,315].map(deg => (
          <line key={deg} x1="16" y1="6" x2="16" y2="10"
            stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${deg} 16 16)`}/>
        ))}
        <circle cx="16" cy="16" r="7" fill="#FBBF24"/>
      </g>
      {/* cloud */}
      <g className="wi-cloud-bob" style={{ animation: 'wi-bob 4s ease-in-out infinite' }}>
        <path d="M38 34H16a8 8 0 0 1 0-16 8 8 0 0 1 15.5-2A6 6 0 0 1 38 22a6 6 0 0 1 0 12z"
          fill="#E5E7EB" opacity=".95"/>
      </g>
    </svg>
  )
}

/* ─── Partly Cloudy (night) ───────────────────────────────────────────── */
function IconPartlyCloudyNight({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
        @media (prefers-reduced-motion: reduce) { .wi-cloud-bob { animation: none !important; } }
      `}</style>
      {/* crescent behind */}
      <path d="M20 6a10 10 0 1 0 0 20 8 8 0 1 1 0-20z" fill="#FCD34D" opacity=".9"/>
      {/* cloud */}
      <g className="wi-cloud-bob" style={{ animation: 'wi-bob 4s ease-in-out infinite' }}>
        <path d="M38 34H16a8 8 0 0 1 0-16 8 8 0 0 1 15.5-2A6 6 0 0 1 38 22a6 6 0 0 1 0 12z"
          fill="#D1D5DB" opacity=".95"/>
      </g>
    </svg>
  )
}

/* ─── Cloudy ──────────────────────────────────────────────────────────── */
function IconCloudy({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-drift { 0%,100% { transform: translateX(0) } 50% { transform: translateX(3px) } }
        @media (prefers-reduced-motion: reduce) { .wi-drift { animation: none !important; } }
      `}</style>
      {/* back cloud */}
      <g className="wi-drift" style={{ animation: 'wi-drift 6s ease-in-out infinite' }}>
        <path d="M36 28H16a7 7 0 0 1 0-14 7 7 0 0 1 13.6-2A5 5 0 0 1 36 16a5 5 0 0 1 0 12z"
          fill="#9CA3AF" opacity=".6"/>
      </g>
      {/* front cloud */}
      <path d="M40 38H14a9 9 0 0 1 0-18 9 9 0 0 1 17.4-2.2A7 7 0 0 1 40 22a7 7 0 0 1 0 16z"
        fill="#D1D5DB"/>
    </svg>
  )
}

/* ─── Rain ────────────────────────────────────────────────────────────── */
function IconRain({ size }) {
  const drops = [
    { x: 18, delay: '0s',   dur: '1s' },
    { x: 24, delay: '0.3s', dur: '0.9s' },
    { x: 30, delay: '0.6s', dur: '1.1s' },
    { x: 21, delay: '0.15s',dur: '1s' },
    { x: 27, delay: '0.45s',dur: '0.95s' },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-drop { 0% { transform: translateY(-4px); opacity:0 } 60% { opacity:1 } 100% { transform: translateY(10px); opacity:0 } }
        @media (prefers-reduced-motion: reduce) { .wi-drop { animation: none !important; opacity:.7 !important; transform: none !important; } }
      `}</style>
      {/* cloud */}
      <path d="M38 26H14a9 9 0 0 1 0-18 9 9 0 0 1 17.4-2.2A7 7 0 0 1 38 10a7 7 0 0 1 0 16z"
        fill="#9CA3AF"/>
      {/* drops */}
      {drops.map((d, i) => (
        <line key={i} className="wi-drop"
          x1={d.x} y1="30" x2={d.x - 2} y2="38"
          stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round"
          style={{ animation: `wi-drop ${d.dur} ${d.delay} linear infinite` }}/>
      ))}
    </svg>
  )
}

/* ─── Heavy Rain / Shower ─────────────────────────────────────────────── */
function IconHeavyRain({ size }) {
  const drops = [
    { x: 14, delay: '0s',    dur: '0.75s' },
    { x: 19, delay: '0.2s',  dur: '0.8s' },
    { x: 24, delay: '0.05s', dur: '0.7s' },
    { x: 29, delay: '0.35s', dur: '0.75s' },
    { x: 34, delay: '0.55s', dur: '0.8s' },
    { x: 17, delay: '0.6s',  dur: '0.7s' },
    { x: 22, delay: '0.4s',  dur: '0.75s' },
    { x: 27, delay: '0.1s',  dur: '0.8s' },
    { x: 32, delay: '0.25s', dur: '0.7s' },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-heavydrop { 0% { transform: translateY(-2px); opacity:0 } 50% { opacity:1 } 100% { transform: translateY(12px); opacity:0 } }
        @media (prefers-reduced-motion: reduce) { .wi-heavydrop { animation: none !important; opacity:.7 !important; } }
      `}</style>
      {/* dark cloud */}
      <path d="M38 24H14a9 9 0 0 1 0-18 9 9 0 0 1 17.4-2.2A7 7 0 0 1 38 8a7 7 0 0 1 0 16z"
        fill="#6B7280"/>
      {drops.map((d, i) => (
        <line key={i} className="wi-heavydrop"
          x1={d.x} y1="27" x2={d.x - 2.5} y2="38"
          stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"
          style={{ animation: `wi-heavydrop ${d.dur} ${d.delay} linear infinite` }}/>
      ))}
    </svg>
  )
}

/* ─── Thunderstorm ────────────────────────────────────────────────────── */
function IconThunderstorm({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-bolt { 0%,90%,100% { opacity:1 } 92%,98% { opacity:.1 } }
        @keyframes wi-raindark { 0% { transform: translateY(-2px); opacity:0 } 55% { opacity:.8 } 100% { transform: translateY(10px); opacity:0 } }
        @media (prefers-reduced-motion: reduce) {
          .wi-bolt { animation: none !important; }
          .wi-raindark { animation: none !important; opacity:.6 !important; }
        }
      `}</style>
      {/* storm cloud */}
      <path d="M38 24H14a9 9 0 0 1 0-18 9 9 0 0 1 17.4-2.2A7 7 0 0 1 38 8a7 7 0 0 1 0 16z"
        fill="#4B5563"/>
      {/* rain behind bolt */}
      {[[14,0],[32,0.4],[19,0.2],[28,0.55]].map(([x, delay], i) => (
        <line key={i} className="wi-raindark"
          x1={x} y1="27" x2={x-2} y2="36"
          stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round"
          style={{ animation: `wi-raindark 0.9s ${delay}s linear infinite` }}/>
      ))}
      {/* lightning bolt */}
      <path className="wi-bolt"
        d="M26 24l-5 8h4l-3 10 9-13h-5z"
        fill="#FDE047"
        style={{ animation: 'wi-bolt 3s ease-in-out infinite' }}/>
    </svg>
  )
}

/* ─── Snow ────────────────────────────────────────────────────────────── */
function IconSnow({ size }) {
  const flakes = [
    { x: 17, delay: '0s',   dur: '2s' },
    { x: 24, delay: '0.6s', dur: '2.2s' },
    { x: 31, delay: '1.1s', dur: '1.9s' },
    { x: 21, delay: '0.3s', dur: '2.1s' },
    { x: 28, delay: '0.85s',dur: '2s' },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-flake { 0% { transform: translateY(-4px) rotate(0deg); opacity:0 } 20% { opacity:1 } 100% { transform: translateY(12px) rotate(180deg); opacity:0 } }
        @media (prefers-reduced-motion: reduce) { .wi-flake { animation: none !important; opacity:.7 !important; } }
      `}</style>
      {/* cloud */}
      <path d="M38 24H14a9 9 0 0 1 0-18 9 9 0 0 1 17.4-2.2A7 7 0 0 1 38 8a7 7 0 0 1 0 16z"
        fill="#BFDBFE"/>
      {flakes.map((f, i) => (
        <g key={i} className="wi-flake"
          style={{ animation: `wi-flake ${f.dur} ${f.delay} linear infinite`, transformOrigin: `${f.x}px 34px` }}>
          <line x1={f.x} y1="30" x2={f.x} y2="38" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"/>
          <line x1={f.x-3} y1="32" x2={f.x+3} y2="36" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1={f.x-3} y1="36" x2={f.x+3} y2="32" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      ))}
    </svg>
  )
}

/* ─── Fog / Mist ──────────────────────────────────────────────────────── */
function IconFog({ size }) {
  const lines = [
    { y: 18, delay: '0s',   w: 28 },
    { y: 24, delay: '0.4s', w: 22 },
    { y: 30, delay: '0.8s', w: 26 },
    { y: 36, delay: '1.2s', w: 18 },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <style>{`
        @keyframes wi-fog { 0%,100% { transform: translateX(0); opacity:.5 } 50% { transform: translateX(4px); opacity:.85 } }
        @media (prefers-reduced-motion: reduce) { .wi-fogline { animation: none !important; opacity:.6 !important; } }
      `}</style>
      {lines.map((l, i) => (
        <line key={i} className="wi-fogline"
          x1={(48 - l.w) / 2} y1={l.y} x2={(48 + l.w) / 2} y2={l.y}
          stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round"
          style={{ animation: `wi-fog 3s ${l.delay} ease-in-out infinite` }}/>
      ))}
    </svg>
  )
}

/* ─── Dispatcher ──────────────────────────────────────────────────────── */
export function WeatherIcon({ code, size = 32 }) {
  if (!code) return <IconSun size={size} />
  const prefix = code.slice(0, 2)
  const isNight = code.endsWith('n')

  switch (prefix) {
    case '01': return isNight ? <IconMoon size={size} /> : <IconSun size={size} />
    case '02': return isNight ? <IconPartlyCloudyNight size={size} /> : <IconPartlyCloudyDay size={size} />
    case '03': return isNight ? <IconPartlyCloudyNight size={size} /> : <IconPartlyCloudyDay size={size} />
    case '04': return <IconCloudy size={size} />
    case '09': return <IconHeavyRain size={size} />
    case '10': return <IconRain size={size} />
    case '11': return <IconThunderstorm size={size} />
    case '13': return <IconSnow size={size} />
    case '50': return <IconFog size={size} />
    default:   return <IconSun size={size} />
  }
}

/**
 * Map an OWM icon code to a scene type for the modal background.
 * Returns one of: 'sunny' | 'night' | 'partly-cloudy' | 'cloudy' |
 *                 'rain' | 'heavy-rain' | 'storm' | 'snow' | 'fog'
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
