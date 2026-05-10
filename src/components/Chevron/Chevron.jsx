import { lazy, Suspense, useMemo, useContext, useRef, useEffect, useState } from 'react'
import { SettingsContext, ThemeContext } from '../../contexts/Settings'
import { useStateSelector } from '../../contexts/Store'
import useTransitions from '../../hooks/useTransitions'
import ChevronTop from '../ChevronTop/ChevronTop'
const MacrosMenu = lazy(() => import('../MacrosMenu/MacrosMenu'))
import { motion, useAnimationControls } from 'framer-motion'
import { easeInOutQuad, easeInQuad, easeOutCubic, easeOutQuad } from '../../functions/animUtils/easings'
import dC from '../../functions/generationUtils/dCommandToString'
import classes from './Chevron.module.css'

const timings = {
  appear: [1],
  smashToSide: [.6, .4],
  menu: [.4, .5, .5]
}
const smoothing = .1
const stretchMultiplier = 8

function Chevron({ visibility, onAnimationEnd }) {
  const settings = useContext(SettingsContext)
  const theme = useContext(ThemeContext)
  
  const duration = settings.general.animationSpeed / 1000
  const thickness = settings.chevron.thickness
  const color = theme.chevron
  const size = settings.chevron.size / 100

  const mode = useStateSelector(store => store.mode)
  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const [isMacrosMenuRendered, setIsMacrosMenuRendered] = useState(false)

  const { stages, pivotOffset } = useMemo(() => {
    const stages = [
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, .5], size) +
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, -.5], size),
      
      dC('M', [.5, .5/size], size) +
      dC('c', [0, smoothing, -.5, .5, -.5, .5], size) +
      dC('M', [.5, .5/size], size) +
      dC('c', [0, -smoothing, -.5, -.5, -.5, -.5], size),
      
      dC('M', [0, .5]) +
      dC('c', [0, smoothing*2, 0, .5, 0, .5]) +
      dC('M', [0, .5]) +
      dC('c', [0, -smoothing*2, 0, -.5, 0, -.5]),
  
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, 0], size) +
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, 0], size),
  
      dC('M', [.5*stretchMultiplier/2, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5*stretchMultiplier, 0], size) +
      dC('M', [.5*stretchMultiplier/2, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5*stretchMultiplier, 0], size)
    ]

    const pivotOffset = {
      x: -.25*size
    }

    return { stages, pivotOffset }
  }, [size])
  
  const svgControls = useAnimationControls(),
        pathControls = useAnimationControls(),
        topMenuControls = useAnimationControls(),
        bottomMenuControls = useAnimationControls()
  const controls = useMemo(() => {
    return ({
      svg: svgControls,
      path: pathControls, 
      topMenu: topMenuControls, 
      bottomMenu: bottomMenuControls
    })
  }, [svgControls, pathControls, topMenuControls, bottomMenuControls])

  const animations = useMemo(() => {
    return ({
      transitions: {
        default: {
          async searching() {
            await controls.path.start({
              translateX: pivotOffset.x,
              d: stages[1],
              transition: {
                ease: 'easeIn',
                duration: duration * timings.smashToSide[1]
              }
            })
            controls.svg.start({
              left: '50%',
              transition: {
                ease: easeOutQuad,
                duration: duration * timings.smashToSide[0]
              }
            })
            return await controls.path.start({
              d: stages[0],
              transition: {
                ease: 'linear',
                duration: duration * (timings.smashToSide[0] - timings.smashToSide[1])
              }
            })
          },
          async opened() {
            setIsMacrosMenuRendered(false)
            controls.topMenu.start({
              clipPath: 'inset(100% 0 0 0)',
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[2]
              }
            })
            await controls.bottomMenu.start({
              translateY: '-100%',
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[2]
              }
            })
            if (mode !== modeRef.current) return 
            await controls.path.start({
              translateX: pivotOffset.x,
              d: stages[3],
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[1]
              }
            })
            if (mode !== modeRef.current) return
            return await controls.path.start({
              d: stages[0],
              transition: {
                ease: easeInOutQuad,
                delay: .1,
                duration: duration * timings.menu[0]
              }
            })
          }
        },
        searching: {
          async default() {
            controls.svg.start({
              left: 0,
              transition: {
                ease: easeInQuad,
                duration: duration * timings.smashToSide[0]
              }
            })
            await controls.path.start({
              translateX: 0,
              d: stages[1],
              transition: {
                ease: 'linear',
                duration: duration * timings.smashToSide[0]
              }
            })
            await controls.path.start({
              translateY: 0,
              d: stages[2],
              transition: {
                ease: easeOutCubic,
                duration: duration * timings.smashToSide[1]
              }
            })
            return onAnimationEnd()
          }
        },
        opened: {
          async default() {
            controls.svg.start({
              left: '50%',
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[0]
              }
            })
            await controls.path.start({
              d: stages[3],
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[0]
              }
            })
            await controls.path.start({
              translateX: 0,
              d: stages[4],
              transition: {
                ease: easeInOutQuad,
                delay: .1,
                duration: duration * timings.menu[1]
              }
            })
            controls.topMenu.start({
              clipPath: 'inset(0% 0 0 0)',
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[2]
              }
            })
            await controls.bottomMenu.start({
              translateY: 0,
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[2]
              }
            })
            return setIsMacrosMenuRendered(true)
          }
        }
      }
    })
  }, [controls, duration, stages, mode, pivotOffset, onAnimationEnd])

  useTransitions(mode, animations, visibility)

  return (
    <div
      className={classes['container']}
      style={{
        '--menu-offset': thickness/2 + 'px',
        visibility: visibility ? 'visible' : 'hidden'
      }}>
      <div className={classes['wrapper']}>
        <motion.div
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={controls.topMenu}>
          <ChevronTop/>
        </motion.div>
      </div>
      <motion.svg
        initial={{ left: '50%' }}
        animate={controls.svg}
        className={classes['svg']}
        viewBox='0 0 0.5 1'>
        <motion.path
          initial={{
            translateX: pivotOffset.x,
            d: stages[0]
          }}
          animate={controls.path}
          stroke={color} 
          strokeWidth={thickness}
          fill="#0000"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"/>
      </motion.svg>
      <div className={classes['wrapper']}>
        <motion.div
          initial={{ translateY: '-100%'}}
          animate={controls.bottomMenu}>
          <Suspense fallback={null}>
            <MacrosMenu
              visibility={visibility}
              fullVisibility={isMacrosMenuRendered}/>
          </Suspense>
        </motion.div>
      </div>
    </div>
  )
}

export default Chevron
