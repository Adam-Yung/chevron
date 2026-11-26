import { memo, useEffect, useRef } from 'react'
import { TbCurrencyDollar, TbEqual, TbRuler2, TbWorld, TbClock, TbBookmark, TbHistory, TbPercentage, TbBinary } from 'react-icons/tb'
import { sameSuggestion } from '../../search/suggestions'
import classes from './Suggestions.module.css'

const ICONS = {
  calculator: TbEqual, percent: TbPercentage, unit: TbRuler2, base: TbBinary, timezone: TbClock,
  currency: TbCurrencyDollar, macro: TbBookmark, history: TbHistory
}

export const SUGGESTIONS_LISTBOX_ID = 'chevron-suggestions'
export const suggestionOptionId = index => `chevron-suggestion-${index}`

const squash = text => text.toLowerCase().replace(/\s+/g, '')

// A caption that only repeats what was typed (a calculator's expression) is noise.
function caption(item, query) {
  if (!item.label || item.type === 'macro' || squash(item.label) === squash(query)) return null
  return item.label
}

const Option = memo(function Option({ item, index, selected, query, onPick, onHover }) {
  const ref = useRef(null)
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])
  const Icon = item.navigation ? TbWorld : ICONS[item.type]
  return (
    <div ref={ref} id={suggestionOptionId(index)} role='option' aria-selected={selected}
      className={classes.suggestion} data-type={item.type} data-selected={selected || undefined}
      // mousedown, not click: the field must keep focus, and the pick must land before any blur handling.
      onMouseDown={e => {
        if (e.button > 1) return
        e.preventDefault()
        onPick(item, e.metaKey || e.ctrlKey || e.button === 1)
      }}
      onMouseMove={() => { if (!selected) onHover(item) }}>
      <div>
        {Icon && <span className={classes.prefix}><Icon /></span>}
        {item.label && item.type === 'macro' && <span className={classes['suggestion-label']}>{item.label}</span>}
        <span className={classes.text}>{item.suggestion}</span>
        {caption(item, query) && <span className={classes.caption}>{caption(item, query)}</span>}
      </div>
    </div>
  )
})

/** The listbox under the search field. Hovering highlights, clicking opens (or copies an answer). */
function Suggestions({ items, selection, query, onPick, onHover }) {
  return (
    <div id={SUGGESTIONS_LISTBOX_ID} role='listbox' aria-label='Suggestions' data-scrollable className={classes.container}>
      {items.map((item, i) => (
        <Option key={item.type + '\u0000' + item.suggestion} item={item} index={i} selected={sameSuggestion(item, selection)} query={query}
          onPick={onPick} onHover={onHover} />
      ))}
    </div>
  )
}

export default memo(Suggestions)
