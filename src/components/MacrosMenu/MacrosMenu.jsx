import { memo, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react'
import useRedirect from '../../hooks/useRedirect'
import useIsKeyPressed from '../../hooks/useIsKeyPressed'
import { useStateSelector , useUpdate} from '../../contexts/Store'
import { SettingsContext } from '../../contexts/Settings'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import { Grid } from '@splidejs/splide-extension-grid'
import Card from '../Card/Card'
import { allowedModes } from '../../rules'
import classes from './MacrosMenu.module.css'
import '@splidejs/react-splide/css'

const pinnedMacros = window.CONFIG.macros.filter(m => m.pinned)

function MacrosMenu({ visibility, fullVisibility }) {
  // settings
  const settings = useContext(SettingsContext)

  const pagination = settings.menu.pagination 
  const arrows = settings.menu.arrows 
  const drag = settings.menu.drag 
  const rows = settings.menu.rows
  const cols = settings.menu.columns
  const gap = settings.menu.gap

  const slideCapacity = cols * rows

  /* store */
  const mode = useStateSelector(store => store.mode)
  // Phase 8a: typed-to-filter buffer. Empty string = show every pinned macro.
  const macroFilter = useStateSelector(store => store.macroFilter)
  // ---

  // Phase 8a: filter the pinned set by case-insensitive substring match
  // against name + triggers + category. Hand-rolled (no MiniSearch dep)
  // because the pinned set is small (<~30 entries) and Phase 6's posture
  // is to avoid extra runtime deps where a few lines suffice.
  const visibleMacros = useMemo(() => {
    const needle = macroFilter.trim().toLowerCase()
    if (!needle) return pinnedMacros
    return pinnedMacros.filter(m => {
      const haystack = [
        m.name,
        m.category,
        ...(Array.isArray(m.triggers) ? m.triggers : [])
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(needle)
    })
  }, [macroFilter])

  const isVisibleSliderHasMultipleSlides = visibleMacros.length > slideCapacity

  // selected macro
  const [selected, setSelected] = useState(null)
  const isShiftPressed = useIsKeyPressed('Shift')
  // if the slider is on the slide with the selected card
  const [isCardInFocus, setIsCardInFocus] = useState(false)
  const sliderRef = useRef(null)

  const updateValue = useUpdate()
  const redirect = useRedirect()

  const activateCard = useCallback(macro => {
    // Compute the slide index from the currently-rendered list, not the
    // full pinned set, so the slider scrolls to the correct page after a
    // filter has narrowed the rows.
    const cardIndex = visibleMacros.indexOf(macro)
    if (cardIndex < 0) return
    
    // select the card
    setSelected(macro)
    // block the store
    updateValue({ redirected: true })
    // go to the selected card
    sliderRef.current.splide.Components.Controller.go(
      Math.floor(cardIndex / slideCapacity),
      // allow going to the current slide
      true,
      () => setIsCardInFocus(true)
    )
    
    // !visibility - ignore animations if the menu isn't visible
    redirect(macro.url, 'card', !visibility)
  }, [redirect, visibility, slideCapacity, updateValue, visibleMacros])

  // hotkeys listener
  useEffect(() => {
    const handleKeypress = e => {
      if (!allowedModes.get('Chevron').has(mode)) return

      if (e.shiftKey) {
        for (const macro of pinnedMacros) {
          if (e.code === macro.key) {
            activateCard(macro)
            break
          }
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
      drag: drag && isVisibleSliderHasMultipleSlides,
      perPage: 1,
      wheel: true,
      keyboard: allowedModes.get('Slider').has(mode) ? 'global' : false,
      grid: {
        cols,
        rows,
        gap: {
          col: gap + 'px',
          row: gap + 'px'
        }
      }
    }
  }
  // Phase 8a: keying Splide on the filter forces a clean remount whenever
  // the visible card set changes, sidestepping Splide's internal slide
  // index caching. The filter changes infrequently (only while typing in
  // macro mode) so the remount cost is acceptable. Phase 8c will revisit
  // this with a proper data-match attribute + CSS dim animation.
  return (
    <div className={classes['container']}>
      <Splide {...splideOptions} key={macroFilter || '__all__'}>
        {
          visibleMacros.map(pm => {
            return (
              <SplideSlide key={pm.name}>
                <Card
                  active={pm === selected && visibility && fullVisibility && isCardInFocus}
                  title={pm.name}
                  icon={pm.icon}
                  bgColor={pm.bgColor}
                  textColor={pm.textColor}
                  hotKey={pm.key && pm.key.slice(-1)}
                  isHintActive={isShiftPressed}
                  onClick={() => activateCard(pm)}/>
              </SplideSlide>
            )
          })
        }
      </Splide>
    </div>
  )
}

export default memo(MacrosMenu)