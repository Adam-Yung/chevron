import { lazy, Suspense, useMemo, useContext, useRef, useEffect, useState } from 'react'
import { SettingsContext, ThemeContext } from '../../contexts/Settings'
import { useStateSelector } from '../../contexts/Store'
import useTransitions from '../../hooks/useTransitions'
import usePathMorph from '../../hooks/usePathMorph'
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

  const pathRef = useRef(null)
  const { morph, setInitialD } = usePathMorph(pathRef, pathControls)

  useEffect(() => {
    setInitialD(stages[0])
  }, [stages, setInitialD])

  const animations = useMemo(() => {
    return ({
      transitions: {
        default: {
          async searching() {
            controls.path.start({
              translateX: pivotOffset.x,
              transition: {
                ease: 'easeIn',
                duration: duration * timings.smashToSide[1]
              }
            })
            await morph(stages[1], {
              ease: 'ease-in',
              duration: duration * timings.smashToSide[1]
            })
            controls.svg.start({
              x: '50vw',
              transition: {
                ease: easeOutQuad,
                duration: duration * timings.smashToSide[0]
              }
            })
            return await morph(stages[0], {
              ease: 'linear',
              duration: duration * (timings.smashToSide[0] - timings.smashToSide[1])
            })
          },
          async opened() {
            setIsMacrosMenuRendered(false)
            controls.topMenu.start({
              opacity: 0,
              y: 16,
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
            controls.path.start({
              translateX: pivotOffset.x,
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[1]
              }
            })
            await morph(stages[3], {
              ease: easeInOutQuad,
              duration: duration * timings.menu[1]
            })
            if (mode !== modeRef.current) return
            return await morph(stages[0], {
              ease: easeInOutQuad,
              duration: duration * timings.menu[0],
              delay: .1
            })
          }
        },
        searching: {
          async default() {
            controls.svg.start({
              x: 0,
              transition: {
                ease: easeInQuad,
                duration: duration * timings.smashToSide[0]
              }
            })
            controls.path.start({
              translateX: 0,
              transition: {
                ease: 'linear',
                duration: duration * timings.smashToSide[0]
              }
            })
            await morph(stages[1], {
              ease: 'linear',
              duration: duration * timings.smashToSide[0]
            })
            controls.path.start({
              translateY: 0,
              transition: {
                ease: easeOutCubic,
                duration: duration * timings.smashToSide[1]
              }
            })
            await morph(stages[2], {
              ease: easeOutCubic,
              duration: duration * timings.smashToSide[1]
            })
            return onAnimationEnd()
          }
        },
        opened: {
          async default() {
            controls.svg.start({
              x: '50vw',
              transition: {
                ease: easeInOutQuad,
                duration: duration * timings.menu[0]
              }
            })
            await morph(stages[3], {
              ease: easeInOutQuad,
              duration: duration * timings.menu[0]
            })
            controls.path.start({
              translateX: 0,
              transition: {
                ease: easeInOutQuad,
                delay: .1,
                duration: duration * timings.menu[1]
              }
            })
            await morph(stages[4], {
              ease: easeInOutQuad,
              duration: duration * timings.menu[1],
              delay: .1
            })
            controls.topMenu.start({
              opacity: 1,
              y: 0,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, morph, duration, stages, pivotOffset, onAnimationEnd])

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
          initial={{ opacity: 0, y: 16 }}
          animate={controls.topMenu}>
          <ChevronTop/>
        </motion.div>
      </div>
      <motion.svg
        initial={{ x: '50vw' }}
        animate={controls.svg}
        className={classes['svg']}
        viewBox='0 0 0.5 1'>
        <motion.path
          ref={pathRef}
          d={stages[0]}
          initial={{ translateX: pivotOffset.x }}
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
