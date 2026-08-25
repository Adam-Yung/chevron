import { lazy, Suspense, useMemo, useContext, useRef, useEffect, useState } from 'react'
import { SettingsContext, ThemeContext } from '../../contexts/Settings'
import { useStateSelector } from '../../contexts/Store'
import useTransitions from '../../hooks/useTransitions'
import useChevronCanvas from './useChevronCanvas'
import ChevronTop from '../ChevronTop/ChevronTop'
const MacrosMenu = lazy(() => import('../MacrosMenu/MacrosMenu'))
import { motion, useAnimationControls } from 'framer-motion'
import { easeInOutQuad, easeInQuad, easeOutCubic, easeOutQuad } from '../../functions/animUtils/easings'
import classes from './Chevron.module.css'

const timings = {
  appear: [1],
  smashToSide: [.6, .4],
  menu: [.4, .5, .5]
}

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

  const canvasRef = useRef(null)
  const { morph, snap } = useChevronCanvas(canvasRef, { size, color, thickness })

  const svgControls = useAnimationControls(),
        topMenuControls = useAnimationControls(),
        bottomMenuControls = useAnimationControls()

  const controls = useMemo(() => ({
    svg: svgControls,
    topMenu: topMenuControls,
    bottomMenu: bottomMenuControls
  }), [svgControls, topMenuControls, bottomMenuControls])

  const animations = useMemo(() => ({
    transitions: {
      default: {
        async searching() {
          morph(1, { ease: 'ease-in', duration: duration * timings.smashToSide[1] })
          controls.svg.start({
            x: '50vw',
            transition: {
              ease: easeOutQuad,
              duration: duration * timings.smashToSide[0]
            }
          })
          await new Promise(r => setTimeout(r, duration * timings.smashToSide[1] * 1000))
          return morph(0, { ease: 'linear', duration: duration * (timings.smashToSide[0] - timings.smashToSide[1]) })
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
          morph(3, { ease: 'easeInOutQuad', duration: duration * timings.menu[1] })
          await new Promise(r => setTimeout(r, duration * timings.menu[1] * 1000))
          if (mode !== modeRef.current) return
          return morph(0, { ease: 'easeInOutQuad', duration: duration * timings.menu[0] })
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
          morph(1, { ease: 'linear', duration: duration * timings.smashToSide[0] })
          await new Promise(r => setTimeout(r, duration * timings.smashToSide[0] * 1000))
          morph(2, { ease: 'easeOutCubic', duration: duration * timings.smashToSide[1] })
          await new Promise(r => setTimeout(r, duration * timings.smashToSide[1] * 1000))
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
          morph(3, { ease: 'easeInOutQuad', duration: duration * timings.menu[0] })
          await new Promise(r => setTimeout(r, duration * timings.menu[0] * 1000))
          morph(4, { ease: 'easeInOutQuad', duration: duration * timings.menu[1] })
          await new Promise(r => setTimeout(r, (duration * timings.menu[1] + 0.1) * 1000))
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [controls, morph, duration, onAnimationEnd])

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
      <motion.div
        initial={{ x: '50vw' }}
        animate={controls.svg}
        className={classes['svg']}>
        <canvas
          ref={canvasRef}
          width={1920}
          height={1920}
          className={classes['canvas']}
        />
      </motion.div>
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
