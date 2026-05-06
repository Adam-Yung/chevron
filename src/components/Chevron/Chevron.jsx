import { lazy, Suspense, useMemo, useContext, useRef, useEffect, useState } from 'react'
import { SettingsContext, ThemeContext } from '../../contexts/Settings'
import { useStateSelector } from '../../contexts/Store'
import useTransitions from '../../hooks/useTransitions'
import ChevronTop from '../ChevronTop/ChevronTop'
import MacroFilterPill from '../MacroFilterPill/MacroFilterPill'
const MacrosMenu = lazy(() => import('../MacrosMenu/MacrosMenu'))
import { motion, useAnimationControls } from 'framer-motion'
import { easeInOutQuad, easeInQuad, easeOutCubic, easeOutQuad } from '../../functions/animUtils/easings'
import dC from '../../functions/generationUtils/dCommandToString'
import classes from './Chevron.module.css'

/*
Phase 7: replaced the single animating `d` path with N stacked static
paths, each representing one shape stage. Transitions between stages are
now pure opacity cross-fades (compositor-only — no repaint per frame).
The SVG element position (left) and the pivot translateX/Y corrections
are unchanged; those are already transform-based and compositor-safe.

Stage index → shape:
  0  normal chevron
  1  smoothed chevron (intermediate, used during smash-to-side)
  2  flat / vertical line (QuickLook transition)
  3  flat / horizontal line (opened mode)
  4  flat / horizontal stretched (opened mode, full-width bar)
*/
const timings = {
  appear: [1],
  smashToSide: [.6, .4],
  menu: [.4, .5, .5]
}
const smoothing = .1
const stretchMultiplier = 8

// Opacity helpers — cross-fade means one stage at 1, rest at 0.
const VISIBLE = { opacity: 1 }
const HIDDEN  = { opacity: 0 }

function Chevron({ visibility, onAnimationEnd }) {
  const settings = useContext(SettingsContext)
  const theme = useContext(ThemeContext)
  
  const duration = settings.general.animationSpeed / 1000
  const thickness = settings.chevron.thickness
  const color = theme.chevron
  const size = settings.chevron.size / 100

  const mode = useStateSelector(store => store.mode)
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  const [isMacrosMenuRendered, setIsMacrosMenuRendered] = useState(false)

  const { stages, pivotOffset } = useMemo(() => {
    const stages = [
      // 0 — normal chevron
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, .5], size) +
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, -.5], size),

      // 1 — smoothed chevron (intermediate)
      dC('M', [.5, .5/size], size) +
      dC('c', [0, smoothing, -.5, .5, -.5, .5], size) +
      dC('M', [.5, .5/size], size) +
      dC('c', [0, -smoothing, -.5, -.5, -.5, -.5], size),

      // 2 — flat vertical line (QuickLook)
      dC('M', [0, .5]) +
      dC('c', [0, smoothing*2, 0, .5, 0, .5]) +
      dC('M', [0, .5]) +
      dC('c', [0, -smoothing*2, 0, -.5, 0, -.5]),

      // 3 — flat horizontal line (opened mode)
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, 0], size) +
      dC('M', [.5, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5, 0], size),

      // 4 — stretched horizontal bar (opened mode, full width)
      dC('M', [.5*stretchMultiplier/2, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5*stretchMultiplier, 0], size) +
      dC('M', [.5*stretchMultiplier/2, .5/size], size) +
      dC('c', [0, 0, 0, 0, -.5*stretchMultiplier, 0], size)
    ]

    const pivotOffset = { x: -.25*size }
    return { stages, pivotOffset }
  }, [size])

  // One animation-controls object per stage path (opacity cross-fade),
  // plus the shared svg-position and menu-panel controls.
  // Named individually (not in an array) so they can be listed as explicit
  // useMemo dependencies — no eslint-disable needed, no hidden surprises.
  const s0 = useAnimationControls() // stage 0 — normal chevron
  const s1 = useAnimationControls() // stage 1 — smoothed chevron
  const s2 = useAnimationControls() // stage 2 — flat vertical (QuickLook)
  const s3 = useAnimationControls() // stage 3 — flat horizontal (opened)
  const s4 = useAnimationControls() // stage 4 — stretched horizontal (opened)
  const svgControls        = useAnimationControls()
  const pivotControls      = useAnimationControls()
  const topMenuControls    = useAnimationControls()
  const bottomMenuControls = useAnimationControls()

  // Indexed for the crossFade helper and the render loop.
  const stageControls = [s0, s1, s2, s3, s4]

  // Cross-fade helper: snap all non-target stages to hidden, fade in target.
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
          // Unflatten: cross-fade from stage 0 → stage 1 (smoothed), then → stage 0
          // While simultaneously sliding the SVG to center.
          await crossFade(1, duration * timings.smashToSide[1], 'easeIn')
          pivotControls.start({
            translateX: pivotOffset.x,
            transition: { duration: duration * timings.smashToSide[1], ease: 'easeIn' }
          })
          svgControls.start({
            left: '50%',
            transition: { ease: easeOutQuad, duration: duration * timings.smashToSide[0] }
          })
          return crossFade(0, duration * (timings.smashToSide[0] - timings.smashToSide[1]), 'linear')
        },
        async opened() {
          setIsMacrosMenuRendered(false)
          // Slide menu panels out
          topMenuControls.start({
            translateY: '100%',
            transition: { ease: easeInOutQuad, duration: duration * timings.menu[2] }
          })
          await bottomMenuControls.start({
            translateY: '-100%',
            transition: { ease: easeInOutQuad, duration: duration * timings.menu[2] }
          })
          if (mode !== modeRef.current) return
          // Cross-fade: stage 0 → stage 3 (flat horizontal), reset pivot
          await crossFade(3, duration * timings.menu[1], easeInOutQuad)
          pivotControls.start({
            translateX: pivotOffset.x,
            transition: { duration: duration * timings.menu[1], ease: easeInOutQuad }
          })
          if (mode !== modeRef.current) return
          // Back to normal chevron
          pivotControls.start({
            translateX: 0,
            transition: { delay: .1, duration: duration * timings.menu[0], ease: easeInOutQuad }
          })
          return crossFade(0, duration * timings.menu[0], easeInOutQuad)
        }
      },
      searching: {
        async default() {
          // Slide SVG to the left side while cross-fading to smoothed shape
          svgControls.start({
            left: 0,
            transition: { ease: easeInQuad, duration: duration * timings.smashToSide[0] }
          })
          await crossFade(1, duration * timings.smashToSide[0], 'linear')
          pivotControls.start({
            translateX: 0,
            transition: { duration: duration * timings.smashToSide[0], ease: 'linear' }
          })
          // Flatten to vertical line
          await crossFade(2, duration * timings.smashToSide[1], easeOutCubic)
          pivotControls.start({
            translateY: 0,
            transition: { duration: duration * timings.smashToSide[1], ease: easeOutCubic }
          })
          return onAnimationEnd()
        }
      },
      opened: {
        async default() {
          // SVG snaps to center
          svgControls.start({
            left: '50%',
            transition: { ease: easeInOutQuad, duration: duration * timings.menu[0] }
          })
          // Cross-fade: stage 0 → stage 3 (flat horizontal)
          await crossFade(3, duration * timings.menu[0], easeInOutQuad)
          // Cross-fade: stage 3 → stage 4 (stretched), and reset pivot
          pivotControls.start({
            translateX: 0,
            transition: { delay: .1, duration: duration * timings.menu[1], ease: easeInOutQuad }
          })
          await crossFade(4, duration * timings.menu[1], easeInOutQuad)
          // Reveal menu panels
          topMenuControls.start({
            translateY: 0,
            transition: { ease: easeInOutQuad, duration: duration * timings.menu[2] }
          })
          await bottomMenuControls.start({
            translateY: 0,
            transition: { ease: easeInOutQuad, duration: duration * timings.menu[2] }
          })
          return setIsMacrosMenuRendered(true)
        }
      }
    }
  }), [duration, stages, mode, pivotOffset, onAnimationEnd,
       svgControls, pivotControls, topMenuControls, bottomMenuControls,
       s0, s1, s2, s3, s4])

  useTransitions(mode, animations, visibility)

  const pathProps = {
    stroke: color,
    strokeWidth: thickness,
    fill: '#0000',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
  }

  return (
    <div
      className={classes['container']}
      style={{
        '--menu-offset': thickness/2 + 'px',
        visibility: visibility ? 'visible' : 'hidden'
      }}>
      <div className={classes['wrapper']}>
        <motion.div
          initial={{ translateY: '100%' }}
          animate={topMenuControls}>
          <ChevronTop/>
        </motion.div>
      </div>
      <motion.svg
        initial={{ left: '50%' }}
        animate={svgControls}
        className={classes['svg']}
        viewBox='0 0 0.5 1'>
        {/* Phase 7: N stacked static paths, cross-faded with opacity.
            No per-frame `d` mutations → zero compositor-layer repaints. */}
        <motion.g
          initial={{ translateX: pivotOffset.x }}
          animate={pivotControls}>
          {stages.map((d, i) => (
            <motion.path
              key={i}
              initial={i === 0 ? VISIBLE : HIDDEN}
              animate={stageControls[i]}
              d={d}
              {...pathProps}
            />
          ))}
        </motion.g>
      </motion.svg>
      <div className={classes['wrapper']}>
        <motion.div
          initial={{ translateY: '-100%' }}
          animate={bottomMenuControls}>
          <MacroFilterPill />
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
