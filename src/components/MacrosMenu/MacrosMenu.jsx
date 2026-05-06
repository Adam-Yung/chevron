import { memo, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react'
import useRedirect from '../../hooks/useRedirect'
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
  // Phase 8b: true iff the menu was opened via Shift. Combined with the
  // filter buffer below to decide whether per-card key hints are shown.
  const macroHintsKeyboard = useStateSelector(store => store.macroHintsKeyboard)
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
  // Phase 8b: hint visibility rule. Hints help only when the user is
  // about to use the keyboard:
  //   - opened via Shift            → show (macroHintsKeyboard === true)
  //   - opened by mouse/touch, then
  //     user starts typing          → show (macroFilter.length > 0)
  //   - opened by mouse/touch, idle → hide
  // Touch-only devices never see hints because there's no keyboard to
  // act on them. Modality is captured once at mount because input mode
  // very rarely changes mid-session.
  const [isPointerCoarse] = useState(() =>
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches
  )
  const hintsActive = !isPointerCoarse && (macroHintsKeyboard || macroFilter.length > 0)
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
                  hotKey={nextHintChar(pm.name, macroFilter)}
                  isHintActive={hintsActive}
                  onClick={() => activateCard(pm)}/>
              </SplideSlide>
            )
          })
        }
      </Splide>
    </div>
  )
}

// Phase 8a polish: derive the per-card hint character from the current
// filter. Empty filter = first char of the name. Filter substring found
// in the name = the character immediately after the matched span. If the
// filter matched via trigger/category (so it isn't a substring of the
// name), fall back to the first char so the hint stays predictable.
// Duplicate hints across cards are intentional — typing the shared char
// keeps both filtered in, which is exactly what filtering is for.
function nextHintChar(name, filter) {
  if (!name) return ''
  const lowerName = name.toLowerCase()
  if (!filter) return lowerName[0] || ''
  const idx = lowerName.indexOf(filter)
  if (idx === -1) return lowerName[0] || ''
  return lowerName[idx + filter.length] || ''
}

export default memo(MacrosMenu)