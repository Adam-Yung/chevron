import { useContext, useEffect, useMemo, useState, useSyncExternalStore, useRef } from 'react'
import useTransitions from '../../hooks/useTransitions'
import useParseQuery from '../../hooks/useParseQuery'
import { SettingsContext, ThemeContext } from '../../contexts/Settings'
import { useStateSelector } from '../../contexts/Store'
import { motion, useAnimationControls } from 'framer-motion'
import Notification from '../Notification/Notification'
import InteractiveBackground from '../InteractiveBackground/InteractiveBackground'
import { easeInBack, easeInOutQuart, easeOutElastic } from '../../functions/animUtils/easings'
import dC from '../../functions/generationUtils/dCommandToString'
import classes from './QuickLook.module.css'

/*
Phase 7: replaced the single animating `d` path (+ clip duplicate) with
N stacked static paths cross-faded via opacity. The dynamic stretch
stages (2 & 3) are recomputed when the viewport resizes but never
mutated per-animation-frame, so the browser compositor handles all the
visual transitions without triggering a repaint on the main thread.

Stage index:
  0  flat / closed (initial)
  1  normal open chevron shape
  2  horizontal stretch (computed from viewport ratio)
  3  vertical stretch   (computed from viewport ratio)
*/
const timings = {
  open: [2.5],
  forward: [1, 1],
  close: [1]
}

const VISIBLE = { opacity: 1 }
const HIDDEN  = { opacity: 0 }

function QuickLook ({ visibility, onAnimationEnd }) {
  const settings = useContext(SettingsContext)
  const theme = useContext(ThemeContext)
  
  const duration = settings.general.animationSpeed / 1000
  const thickness = settings.chevron.thickness
  const color = theme.chevron
  const topCurvature = settings.chevron.quickLook.topCurvature
  const bottomCurvature = settings.chevron.quickLook.bottomCurvature
  const showMacrosLabel = settings.chevron.quickLook.showMacrosLabel
  const notifyAboutForcedSearchEngine = settings.query.notifyAboutForcedSearchEngine
  
  const mode = useStateSelector(store => store.mode)
  const query = useStateSelector(store => store.query)
  const redirected = useStateSelector(store => store.redirected)
  const selectedSuggestion = useStateSelector(store => store.selectedSuggestion)

  const [persistedQuery, setPersistedQuery] = useState(query)
  useEffect(() => {
    if (query) setPersistedQuery(query)
  }, [query])

  const [parsedQuery, isSearchEngineForced] = useParseQuery(
    selectedSuggestion ? selectedSuggestion.suggestion : persistedQuery,
    selectedSuggestion ? selectedSuggestion.type : undefined,
    persistedQuery,
    redirected)

  let label = parsedQuery.label
  if (parsedQuery.type === 'macro' && !showMacrosLabel)
    label = ''

  const viewport = useViewportSize()
  const { width, height } = viewport

  // Stage 0 and 1 are pure shape constants; stages 2 and 3 depend on the
  // viewport ratio (they fan out to cover the full screen) and are
  // recomputed only when the viewport changes — not on every frame.
  const stages = useMemo(() => {
    const ratio = width / height
    return [
      // 0 — flat / closed
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, .5]) +
      dC('c', [0, 0, 0, 0, 0, -.5]) +
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, -.5]) +
      dC('c', [0, 0, 0, 0, 0, .5]),

      // 1 — normal open shape
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, .5]) +
      dC('c', [0, -bottomCurvature, .5, -topCurvature, .5, -.5]) +
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, -.5]) +
      dC('c', [0, bottomCurvature, .5, topCurvature, .5, .5]),

      // 2 — horizontal stretch
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, .5]) +
      dC('c', [0, -bottomCurvature, .5, -topCurvature, ratio*2, -.5]) +
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, -.5]) +
      dC('c', [0, bottomCurvature, .5, topCurvature, ratio*2, .5]),

      // 3 — vertical stretch
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, .5]) +
      dC('c', [ratio*4, 0, ratio*2, 0, ratio*2, -.5]) +
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, -.5]) +
      dC('c', [ratio*4, 0, ratio*2, 0, ratio*2, .5]),
    ]
  }, [width, height, bottomCurvature, topCurvature])

  // One controls object per stage (opacity cross-fade) + text label controls.
  // Named individually so they appear as explicit useMemo dependencies.
  const s0 = useAnimationControls() // stage 0 — flat / closed
  const s1 = useAnimationControls() // stage 1 — normal open shape
  const s2 = useAnimationControls() // stage 2 — horizontal stretch
  const s3 = useAnimationControls() // stage 3 — vertical stretch
  const textControls = useAnimationControls()

  const stageControls = [s0, s1, s2, s3]

  function crossFade(targetIdx, fadeDuration, ease) {
    return Promise.all(stageControls.map((ctrl, i) => {
      if (i === targetIdx)
        return ctrl.start({ opacity: 1, transition: { duration: fadeDuration, ease } })
      ctrl.set({ opacity: 0 })
      return Promise.resolve()
    }))
  }

  const animations = useMemo(() => ({
    transitions: {
      default: {
        async searching() {
          // Close: flatten back to stage 0, slide label out
          crossFade(0, duration * timings.close[0], easeInBack)
          await textControls.start({
            translateX: '-100%',
            transition: { ease: easeInBack, duration: duration * timings.close[0] }
          })
          textControls.set({ translateX: '0%' })
          return onAnimationEnd()
        }
      },
      searching: {
        async default() {
          // Open: cross-fade stage 0 → stage 1, slide label in
          crossFade(1, duration * timings.open[0], easeOutElastic)
          return await textControls.start({
            translateX: '0%',
            transition: { ease: easeOutElastic, duration: duration * timings.open[0] }
          })
        }
      },
      redirected: {
        async any() {
          // Horizontal stretch: stage 1 → stage 2, label to center
          crossFade(2, duration * timings.forward[0], easeInOutQuart)
          await textControls.start({
            left: width / 2,
            x: '-50%',
            transition: { ease: easeInOutQuart, duration: duration * timings.forward[0] }
          })
          // Vertical stretch: stage 2 → stage 3
          await crossFade(3, duration * timings.forward[1], easeInOutQuart)
          return window.mainRedirectAnimationEnd?.()
        }
      }
    }
  }), [duration, onAnimationEnd, width, textControls, s0, s1, s2, s3])

  const state = redirected ? 'redirected' : mode
  useTransitions(state, animations, visibility)

  const pathProps = {
    fill: '#0000',
    stroke: color,
    strokeWidth: thickness,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
  }
  // The clip path needs a separate set of paths (same shapes, no stroke).
  // We reuse the same stageControls for opacity so clip and visible paths
  // always cross-fade in lockstep.
  const clipScale = height / width

  return <>
    {
      isSearchEngineForced && notifyAboutForcedSearchEngine && <Notification
        type='warning'
        title='Ctrl is pressed'
        description='Search engine will be used for all queries'/>
    }
    <div style={{
      '--thickness': thickness + 'px',
      '--fontSize': '5vmin',
      '--textColor': parsedQuery.textColor,
      pointerEvents: 'none',
      visibility: visibility ? 'visible' : 'hidden',
      alignSelf: 'flex-start'
    }}>
      <div className={classes['clip-container']}>
        <motion.div
          className={classes['label-container']}
          animate={textControls}>
          <div className={classes['label']}>{label}</div>
        </motion.div>
        <InteractiveBackground
          width={width}
          height={height}
          color={parsedQuery.bgColor}
          textColor={parsedQuery.textColor}
          marqueeText={parsedQuery.marquee}/>
      </div>
      <svg
        className={classes['svg']}
        viewBox='0 0 1 1'>
        {/* Visible stroked paths — one per stage, cross-faded */}
        {stages.map((d, i) => (
          <motion.path
            key={i}
            initial={i === 0 ? VISIBLE : HIDDEN}
            animate={stageControls[i]}
            d={d}
            {...pathProps}
          />
        ))}
        {/* Clip paths — same shapes, opacity-linked to the same controls */}
        <clipPath id="quick-look-clip-path" clipPathUnits="objectBoundingBox">
          {stages.map((d, i) => (
            <motion.path
              key={i}
              initial={i === 0 ? VISIBLE : HIDDEN}
              animate={stageControls[i]}
              transform={`scale(${clipScale}, 1)`}
              d={d}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </clipPath>
      </svg>
    </div>
  </>
}

function useViewportSize() {
  const snapshotRef = useRef({ width: window.innerWidth, height: window.innerHeight })

  const subscribe = (listener) => {
    let frame = null
    const onResize = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        snapshotRef.current = { width: window.innerWidth, height: window.innerHeight }
        listener()
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }
  const getSnapshot = () => snapshotRef.current

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export default QuickLook
