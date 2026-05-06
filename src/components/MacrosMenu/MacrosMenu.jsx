import { memo, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react'
import useRedirect from '../../hooks/useRedirect'
import { useStateSelector, useUpdate } from '../../contexts/Store'
import { SettingsContext } from '../../contexts/Settings'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import { Grid } from '@splidejs/splide-extension-grid'
import { motion } from 'framer-motion'
import Card from '../Card/Card'
import { allowedModes } from '../../rules'
import { pinnedMacros, score } from './macroData'
import classes from './MacrosMenu.module.css'
import '@splidejs/react-splide/css'

// Phase 8c: framer-motion stagger variants for the card grid.
// Built on opacity+translateY only (compositor-safe, Phase 7 spirit).
const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0 }
  }
}
const itemVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } }
}

function MacrosMenu({ visibility, fullVisibility }) {
  const settings = useContext(SettingsContext)

  const pagination = settings.menu.pagination
  const arrows     = settings.menu.arrows
  const drag       = settings.menu.drag
  const rows       = settings.menu.rows
  const cols       = settings.menu.columns
  const gap        = settings.menu.gap
  const glassmorphism  = settings.appearance?.macroMenu?.glassmorphism  ?? false
  const enableTrackpad = settings.appearance?.gestures?.enableTrackpad ?? true

  const mode             = useStateSelector(store => store.mode)
  const macroFilter      = useStateSelector(store => store.macroFilter)
  const macroHintsKeyboard = useStateSelector(store => store.macroHintsKeyboard)

  // Phase 8c: ranked scorer replaces plain substring filter.
  const visibleMacros = useMemo(() => {
    const needle = macroFilter.trim().toLowerCase()
    if (!needle) return pinnedMacros
    return pinnedMacros
      .map(m => ({ m, s: score(m, needle) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ m }) => m)
  }, [macroFilter])

  const [selected, setSelected]         = useState(null)
  const [isPointerCoarse] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  )
  const hintsActive = !isPointerCoarse && (macroHintsKeyboard || macroFilter.length > 0)
  const [isCardInFocus, setIsCardInFocus] = useState(false)
  const sliderRef    = useRef(null)
  const containerRef = useRef(null)

  // When the filter is active, the MacroFilterPill adds ~40px above the
  // grid. Keep grid rows unchanged — reducing rows inflates card size.
  // Instead, the container height is reduced via CSS data attribute so
  // the pill + cards together fit within the available half-screen space.
  const activeRows     = rows
  const slideCapacity  = cols * activeRows
  const isVisibleSliderHasMultipleSlides = visibleMacros.length > slideCapacity

  const updateValue = useUpdate()
  const redirect    = useRedirect()

  const activateCard = useCallback(macro => {
    const cardIndex = visibleMacros.indexOf(macro)
    if (cardIndex < 0) return
    setSelected(macro)
    updateValue({ redirected: true })
    sliderRef.current.splide.Components.Controller.go(
      Math.floor(cardIndex / slideCapacity),
      true,
      () => setIsCardInFocus(true)
    )
    redirect(macro.url, 'card', !visibility)
  }, [redirect, visibility, slideCapacity, updateValue, visibleMacros])

  useEffect(() => {
    const handleKeypress = e => {
      if (!allowedModes.get('Chevron').has(mode)) return
      if (e.shiftKey) {
        for (const macro of pinnedMacros) {
          if (e.code === macro.key) { activateCard(macro); break }
        }
      }
    }
    document.addEventListener('keypress', handleKeypress)
    return () => document.removeEventListener('keypress', handleKeypress)
  }, [mode, activateCard])

  // Enter while the menu is open activates the first visible result.
  // Uses keydown (not keypress) so it fires reliably for Enter.
  // preventDefault stops any upstream handler (e.g. QueryField) from also
  // reacting. No-op when isEmpty or there is nothing to activate.
  useEffect(() => {
    const handleKeydown = e => {
      if (e.code !== 'Enter') return
      if (!allowedModes.get('Chevron').has(mode)) return
      if (visibleMacros.length === 0) return
      e.preventDefault()
      activateCard(visibleMacros[0])
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [mode, visibleMacros, activateCard])

  const splideOptions = {
    ref: sliderRef,
    tag: 'section',
    extensions: { Grid },
    options: {
      pagination,
      arrows: arrows && isVisibleSliderHasMultipleSlides,
      drag:   drag   && isVisibleSliderHasMultipleSlides,
      perPage: 1,
      // Disable Splide's built-in wheel so we can implement weighted snap.
      wheel: false,
      keyboard: allowedModes.get('Slider').has(mode) ? 'global' : false,
      grid: {
        cols,
        rows: activeRows,
        gap: { col: gap + 'px', row: gap + 'px' }
      }
    }
  }

  // Weighted horizontal scroll with snap-to-slide. Accumulates deltaX until
  // a threshold is reached, then advances one slide and resets. A decay
  // timeout resets the accumulator if the user pauses. This gives a natural
  // "weight" feeling — a flick goes one slide, a slow scroll stays put.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let accX = 0
    let decayTimer = null
    const THRESHOLD = 160  // px of accumulated deltaX before a slide change
    const DECAY_MS  = 380  // ms of no scroll before resetting accumulator

    const onWheel = (e) => {
      if (!enableTrackpad) return
      // Only handle primarily-horizontal scroll; let vertical pass through
      // to the App-level handler for open/close.
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) * 1.5) return
      e.preventDefault()
      e.stopPropagation()

      clearTimeout(decayTimer)
      accX += e.deltaX

      if (Math.abs(accX) >= THRESHOLD) {
        sliderRef.current?.splide?.go(accX > 0 ? '+' : '-')
        accX = 0
      }
      decayTimer = setTimeout(() => { accX = 0 }, DECAY_MS)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      clearTimeout(decayTimer)
    }
  }, [enableTrackpad]) // containerRef and sliderRef are stable refs

  // Phase 8c: empty state when filter matches nothing.
  const isEmpty = macroFilter.length > 0 && visibleMacros.length === 0

  return (
      <div
      ref={containerRef}
      className={classes['container']}
      style={{ '--grid-rows': activeRows }}
      data-filtered={macroFilter.length > 0 || undefined}
      data-glassmorphism={glassmorphism || undefined}>
      {isEmpty ? (
        <div className={classes['empty']}>
          <span className={classes['empty-icon']}>🔍</span>
          <span className={classes['empty-text']}>no matches for</span>
          <span className={classes['empty-filter']}>{macroFilter}</span>
        </div>
      ) : (
        // Key on macroFilter so Splide remounts on filter change (8a behavior,
        // retained per Option A in § 3.5.3). The stagger re-fires on remount,
        // which is the desired effect — new card set slides in fresh.
        <Splide {...splideOptions} key={macroFilter || '__all__'}>
          {visibleMacros.map(pm => (
            <SplideSlide key={pm.name}>
              {/* motion.li wrapper for stagger entrance (Phase 7 primitives:
                  opacity + translateY only). */}
              <motion.div
                className={classes['slide-inner']}
                variants={itemVariants}
                initial="hidden"
                animate="visible">
                <Card
                  active={pm === selected && visibility && fullVisibility && isCardInFocus}
                  title={pm.name}
                  icon={pm.icon}
                  bgColor={pm.bgColor}
                  textColor={pm.textColor}
                  macroName={pm.name}
                  revealCount={macroFilter.length > 0 ? macroFilter.length + 1 : (hintsActive ? 1 : 0)}
                  isHintActive={hintsActive}
                  onClick={() => activateCard(pm)}/>
              </motion.div>
            </SplideSlide>
          ))}
        </Splide>
      )}
    </div>
  )
}

export default memo(MacrosMenu)
