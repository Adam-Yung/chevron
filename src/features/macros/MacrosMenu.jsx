import { memo, useContext, useEffect, useMemo, useRef } from 'react'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import { Grid } from '@splidejs/splide-extension-grid'
import { SettingsContext } from '../../settings/SettingsProvider'
import { useUi } from '../../state/UiStore'
import { usePinnedMacros } from '../../search/useConfig'
import { GESTURE_MACRO_PAGE } from '../../input/gestureEvents'
import { isTouch } from '../../lib/isMobile'
import Card from './Card'
import { filterMacros } from './filterMacros'
import useGridShape from './useGridShape'
import classes from './MacrosMenu.module.css'
import '@splidejs/react-splide/css'

const WHEEL = { threshold: 160, decayMs: 380 }

// Horizontal trackpad scroll pages the grid one page per deliberate swipe; vertical scroll is left to the open/close toggle.
function useWheelPaging(containerRef, sliderRef, enabled) {
  useEffect(() => {
    const el = containerRef.current
    if (!el || !enabled) return undefined
    let acc = 0
    let decay = 0
    const onWheel = e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) * 1.5) return
      e.preventDefault()
      clearTimeout(decay)
      decay = setTimeout(() => { acc = 0 }, WHEEL.decayMs)
      acc += e.deltaX
      if (Math.abs(acc) < WHEEL.threshold) return
      sliderRef.current?.splide?.go(acc > 0 ? '+' : '-')
      acc = 0
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      clearTimeout(decay)
    }
  }, [containerRef, sliderRef, enabled])
}

function useGesturePaging(sliderRef, active) {
  useEffect(() => {
    if (!active) return undefined
    const onPage = e => {
      const dir = e.detail?.dir
      if (dir === '+' || dir === '-') sliderRef.current?.splide?.go(dir)
    }
    window.addEventListener(GESTURE_MACRO_PAGE, onPage)
    return () => window.removeEventListener(GESTURE_MACRO_PAGE, onPage)
  }, [sliderRef, active])
}

function Empty({ filter }) {
  return (
    <div className={classes.empty} role='status'>
      <span className={classes['empty-text']}>no sites match</span>
      <span className={classes['empty-filter']}>{filter}</span>
    </div>
  )
}

/** The sites grid: pinned macros, narrowed by the typed filter, paged by Splide. */
function MacrosMenu({ active, onOpen }) {
  const settings = useContext(SettingsContext)
  const menu = settings.menu
  const pinned = usePinnedMacros()
  const filter = useUi(s => s.macroFilter)
  const hints = useUi(s => s.hints) && !isTouch
  const cursor = useUi(s => s.menuCursor)
  const visible = useMemo(() => filterMacros(pinned, filter), [pinned, filter])
  const { cols, rows } = useGridShape(menu.columns, menu.rows)
  const perPage = cols * rows
  const paged = visible.length > perPage
  const sliderRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (cursor !== null) sliderRef.current?.splide?.go(Math.floor(cursor / perPage))
  }, [cursor, perPage])
  useWheelPaging(containerRef, sliderRef, active && (settings.appearance.gestures?.enableTrackpad ?? true))
  useGesturePaging(sliderRef, active)

  const options = {
    pagination: menu.pagination,
    arrows: menu.arrows && paged,
    // On touch the app's own swipe handling pages the grid; two handlers on one gesture fight.
    drag: !isTouch && menu.drag && paged,
    perPage: 1,
    wheel: false,
    keyboard: false,
    grid: { cols, rows, gap: { col: menu.gap + 'px', row: menu.gap + 'px' } }
  }
  const shownCursor = cursor ?? (filter ? 0 : null)

  return (
    // The container always renders, even around the empty state, so the wheel listener bound to it never ends up on a detached node.
    <div ref={containerRef} className={classes.container} style={{ '--grid-rows': rows, '--grid-cols': cols }}>
      {filter && !visible.length ? <Empty filter={filter} /> : <Splide ref={sliderRef} tag='section' aria-label='Sites' extensions={{ Grid }} options={options} key={`${filter}:${cols}x${rows}`}>
        {visible.map((macro, i) => (
          <SplideSlide key={macro.name}>
            <div className={classes['slide-inner']} style={{ '--i': i % perPage }}>
              <Card macro={macro} filter={filter} hint={hints} focused={i === shownCursor} onOpen={onOpen} />
            </div>
          </SplideSlide>
        ))}
      </Splide>}
    </div>
  )
}

export default memo(MacrosMenu)
