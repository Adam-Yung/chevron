import classes from './WeatherModal.module.css'

const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315]
const STARS = [[15, 18], [80, 12], [60, 55], [25, 70], [88, 65], [50, 30], [10, 42]]

function Cloud({ dx, dur, op, scale, top, left }) {
  const style = { '--dx': dx, '--dur': dur, '--op': op, '--scale': scale, top, left }
  return <div className={classes['sc-cloud']} style={style} />
}

function Sun({ opacity }) {
  return <div className={classes['sun-disc']} style={opacity ? { opacity } : undefined} />
}

// Drop positions are a deterministic function of the index so a re-render never reshuffles the rain.
function Drops({ count, x: [xStep, xWave, xFreq], delay: [dStep, dMod], dur: [base, step, mod, digits], len: [lBase, lStep, lMod] }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className={classes['raindrop']} style={{
      '--x': `${(i * xStep + Math[xFreq[0]](i * xFreq[1]) * xWave).toFixed(1)}%`,
      '--delay': `${(i * dStep % dMod).toFixed(2)}s`,
      '--dur': `${(base + (i % mod) * step).toFixed(digits)}s`,
      '--len': `${lBase + (i % lMod) * lStep}px`
    }} />
  ))
}

function Snow() {
  return Array.from({ length: 24 }, (_, i) => (
    <div key={i} className={classes['snowflake']} style={{
      '--x': `${(i * 4.2 + Math.sin(i * 2) * 8).toFixed(1)}%`,
      '--delay': `${(i * 0.18 % 3.5).toFixed(2)}s`,
      '--dur': `${(2.5 + (i % 5) * 0.4).toFixed(1)}s`,
      '--size': `${3 + (i % 3) * 1.5}px`
    }} />
  ))
}

const SCENES = {
  sunny: () => <>
    <Sun />
    <div className={classes['sun-halo']} />
    {SUN_RAYS.map(deg => <div key={deg} className={classes['sun-ray']} style={{ '--deg': `${deg}deg` }} />)}
    <Cloud dx="-8%" dur="22s" op="0.18" scale="1" />
    <Cloud dx="-5%" dur="30s" op="0.12" scale="0.6" />
  </>,
  night: () => <>
    <div className={classes['moon']} />
    {STARS.map(([x, y], i) => (
      <div key={i} className={classes['star']} style={{ '--x': `${x}%`, '--y': `${y}%`, '--delay': `${(i * 0.7).toFixed(1)}s` }} />
    ))}
  </>,
  'partly-cloudy': () => <>
    <Sun opacity={0.6} />
    <Cloud dx="-12%" dur="25s" op="0.85" scale="1" />
    <Cloud dx="-8%" dur="35s" op="0.6" scale="0.7" top="45%" left="55%" />
  </>,
  cloudy: () => <>
    <Cloud dx="-10%" dur="20s" op="0.9" scale="1.1" />
    <Cloud dx="-6%" dur="28s" op="0.7" scale="0.75" top="40%" left="60%" />
    <Cloud dx="-8%" dur="35s" op="0.5" scale="0.5" top="60%" left="20%" />
  </>,
  rain: () => <>
    <Cloud dx="-5%" dur="22s" op="0.85" scale="1.1" />
    <Drops count={22} x={[4.5, 6, ['sin', 1]]} delay={[0.13, 1.4]} dur={[0.7, 0.1, 4, 1]} len={[14, 3, 5]} />
  </>,
  'heavy-rain': () => <>
    <Cloud dx="-4%" dur="18s" op="0.95" scale="1.15" />
    <Drops count={38} x={[2.65, 3, ['cos', 1]]} delay={[0.08, 1]} dur={[0.5, 0.08, 4, 2]} len={[18, 3, 6]} />
  </>,
  storm: () => <>
    <Cloud dx="-3%" dur="15s" op="1" scale="1.2" />
    <Drops count={28} x={[3.6, 5, ['sin', 1.3]]} delay={[0.09, 1.1]} dur={[0.55, 0.09, 3, 2]} len={[20, 4, 5]} />
    {['0s', '2.1s', '4.4s'].map(delay => <div key={delay} className={classes['lightning']} style={{ '--delay': delay }} />)}
  </>,
  snow: () => <>
    <Cloud dx="-6%" dur="25s" op="0.7" scale="1" />
    <Snow />
  </>,
  fog: () => [0, 1, 2, 3].map(i => (
    <div key={i} className={classes['fog-band']} style={{ '--i': i, '--delay': `${i * 1.1}s` }} />
  ))
}

/** Pure-CSS animated backdrop for the modal hero; keyframes stay in the modal stylesheet. */
export default function WeatherScene({ scene }) {
  const render = SCENES[scene] ?? SCENES.sunny
  return (
    <div className={`${classes['scene']} ${classes[`scene--${scene}`]}`} aria-hidden="true">
      {render()}
    </div>
  )
}
