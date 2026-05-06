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
  const glassmorphism = settings.appearance?.macroMenu?.glassmorphism ?? false

  const slideCapacity = cols * rows

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

  const isVisibleSliderHasMultipleSlides = visibleMacros.length > slideCapacity

  const [selected, setSelected]         = useState(null)
  const [isPointerCoarse] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  )
  const hintsActive = !isPointerCoarse && (macroHintsKeyboard || macroFilter.length > 0)
  const [isCardInFocus, setIsCardInFocus] = useState(false)
  const sliderRef = useRef(null)

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

  const splideOptions = {
    ref: sliderRef,
    tag: 'section',
    extensions: { Grid },
    options: {
      pagination,
      arrows: arrows && isVisibleSliderHasMultipleSlides,
      drag:   drag   && isVisibleSliderHasMultipleSlides,
      perPage: 1,
      wheel: true,
      keyboard: allowedModes.get('Slider').has(mode) ? 'global' : false,
      grid: {
        cols,
        rows,
        gap: { col: gap + 'px', row: gap + 'px' }
      }
    }
  }

  // Phase 8c: empty state when filter matches nothing.
  const isEmpty = macroFilter.length > 0 && visibleMacros.length === 0

  return (
    <div
      className={classes['container']}
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
                  hotKey={nextHintChar(pm.name, macroFilter)}
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

function nextHintChar(name, filter) {
  if (!name) return ''
  const lowerName = name.toLowerCase()
  if (!filter) return lowerName[0] || ''
  const idx = lowerName.indexOf(filter)
  if (idx === -1) return lowerName[0] || ''
  return lowerName[idx + filter.length] || ''
}

export default memo(MacrosMenu)
