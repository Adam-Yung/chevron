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

const timings = {
  open: [2.5],
  forward: [1, 1],
  close: [1]
}

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
    if (query) 
      setPersistedQuery(query)
  }, [query])

  const [parsedQuery, isSearchEngineForced] = useParseQuery(
    selectedSuggestion ? selectedSuggestion.suggestion : persistedQuery, 
    selectedSuggestion ? selectedSuggestion.type : undefined, 
    persistedQuery,
    redirected)

  let label = parsedQuery.label
  if (parsedQuery.type === 'macro' && !showMacrosLabel)
    label = ''

  const stages = useMemo(() => [
    dC('M', [0, .5]) +
    dC('c', [0, 0, 0, 0, 0, .5]) +
    dC('c', [0, 0, 0, 0, 0, -.5]) +
    dC('M', [0, .5]) +
    dC('c', [0, 0, 0, 0, 0, -.5]) +
    dC('c', [0, 0, 0, 0, 0, .5]),
    
    dC('M', [0, .5]) +
    dC('c', [0, 0, 0, 0, 0, .5]) +
    dC('c', [0, -bottomCurvature, .5, -topCurvature, .5, -.5]) +
    dC('M', [0, .5]) +
    dC('c', [0, 0, 0, 0, 0, -.5]) +
    dC('c', [0, bottomCurvature, .5, topCurvature, .5, .5]),
    
    (ratio) => (
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, .5]) +
      dC('c', [0, -bottomCurvature, .5, -topCurvature, ratio*2, -.5]) +
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, -.5]) +
      dC('c', [0, bottomCurvature, .5, topCurvature, ratio*2, .5])
    ),

    (ratio) => (
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, .5]) +
      dC('c', [ratio*4, 0, ratio*2, 0, ratio*2, -.5]) +
      dC('M', [0, .5]) +
      dC('c', [0, 0, 0, 0, 0, -.5]) +
      dC('c', [ratio*4, 0, ratio*2, 0, ratio*2, .5])
    )
  ], [bottomCurvature, topCurvature])

  const viewport = useViewportSize()
  const { width, height } = viewport

  const pathControls = useAnimationControls(),
        textControls = useAnimationControls()
  const controls = useMemo(() => {
    return ({
      path: pathControls, 
      text: textControls
    })
  }, [pathControls, textControls])

  const animations = useMemo(() => {
    return ({
      transitions: {
        default: {
          async searching() {
            controls.path.start({
              d: stages[0],
              transition: {
                ease: easeInBack,
                duration: duration * timings.close[0]
              }
            })
            await controls.text.start({
              translateX: '-100%',
              transition: {
                ease: easeInBack,
                duration: duration * timings.close[0]
              }
            })
            controls.text.set({
              translateX: '0%'
            })
            return onAnimationEnd()
          }
        },
        searching: {
          async default() {
            controls.path.start({
              d: stages[1],
              transition: {
                ease: easeOutElastic,
                duration: duration * timings.open[0]
              }
            })
            return await controls.text.start({
              translateX: '0%',
              transition: {
                ease: easeOutElastic,
                duration: duration * timings.open[0]
              }
            })
          }
        },
        redirected: {
          async any() {
            controls.path.start({
              d: stages[2](window.innerWidth/window.innerHeight),
              transition: {
                ease: easeInOutQuart,
                duration: duration * timings.forward[0]
              }
            })
            await controls.text.start({
              left: window.innerWidth/2,
              x: '-50%',
              transition: {
                ease: easeInOutQuart,
                duration: duration * timings.forward[0]
              }
            })
            await controls.path.start({
              d: stages[3](window.innerWidth/window.innerHeight),
              transition: {
                ease: easeInOutQuart,
                duration: duration * timings.forward[1]
              }
            })
            return window.mainRedirectAnimationEnd?.()
          }
        }
      }
    })
  }, [controls, duration, stages, onAnimationEnd])

  const state = redirected ? 'redirected' : mode
  useTransitions(state, animations, visibility)

  const variables = {
    '--thickness': thickness + 'px',
    '--fontSize': '5vmin',
    '--textColor': parsedQuery.textColor
  }

  return <>
    {
      isSearchEngineForced && notifyAboutForcedSearchEngine && <Notification 
        type='warning'
        title='Ctrl is pressed'
        description='Search engine will be used for all queries'/>
    }
    <div style={{
      ...variables,
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
        <motion.path
          animate={pathControls}
          initial={{d: stages[0]}}
          d={stages[0]}
          fill="#0000"
          stroke={color} 
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"/>
        <clipPath id="quick-look-clip-path" clipPathUnits="objectBoundingBox">
          <motion.path
            transform={`scale(${height/width}, 1)`}
            animate={pathControls}
            initial={{d: stages[0]}}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"/>
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
