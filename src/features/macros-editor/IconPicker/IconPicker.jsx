import { memo, useMemo, useState } from 'react'
import classes from './IconPicker.module.css'
import shared from '../Picker.module.css'
import PickerPopover from '../PickerPopover'
import { usePopover } from '../usePopover'

// Read when the picker renders, not at module load: window.ICONS comes from a classic script that must have run first.
function iconNames() {
  return Object.keys(window.ICONS || {})
}

function IconGrid({ names, query, value, onSelect }) {
  if (names.length === 0) return <div className={classes['no-results']}>No icons match &ldquo;{query}&rdquo;</div>
  return names.map(name => (
    <button
      key={name}
      type="button"
      className={`${classes['swatch']} ${name === value ? classes['selected'] : ''}`}
      title={name}
      aria-label={name}
      onClick={() => onSelect(name)}
    >
      <span dangerouslySetInnerHTML={{ __html: window.ICONS[name] }} />
    </button>
  ))
}

function IconTrigger({ pop, value, onClick }) {
  const svg = value && window.ICONS?.[value]
  return (
    <button
      ref={pop.triggerRef}
      type="button"
      className={shared['trigger']}
      onClick={onClick}
      aria-expanded={pop.open}
      title={value || 'Pick an icon'}
      aria-label={value ? `Icon: ${value}. Click to change.` : 'Pick an icon'}
    >
      {svg
        ? <span className={classes['svg-wrap']} dangerouslySetInnerHTML={{ __html: svg }} />
        : <span className={classes['placeholder']}>?</span>}
      <span className={classes['trigger-name']}>{value || <em>none</em>}</span>
    </button>
  )
}

function IconPopover({ pop, query, onQuery, names, value, onSelect }) {
  return (
    <PickerPopover pop={pop} className={classes['popover']}>
      <input
        className={classes['search']}
        type="text"
        placeholder="Search icons…"
        aria-label="Search icons"
        value={query}
        autoFocus
        onChange={e => onQuery(e.target.value)}
      />
      <div className={classes['grid']}>
        <IconGrid names={names} query={query} value={value} onSelect={onSelect} />
      </div>
      <div className={classes['hint']}>
        Add icons: <code>node scripts/add-icon.mjs domain.com --write</code>
        <br />or paste SVG markup into <code>public/icons.js</code>
      </div>
    </PickerPopover>
  )
}

function selectIcon(name, onChange, close) {
  onChange(name)
  close()
}

function toggleCleared(setQuery, toggle) {
  setQuery('')
  toggle()
}

function IconPicker({ value, onChange }) {
  const pop = usePopover()
  const [query, setQuery] = useState('')
  const names = useMemo(() => {
    const q = query.trim().toLowerCase()
    return iconNames().filter(name => name.toLowerCase().includes(q))
  }, [query])

  return (
    <div className={shared['root']}>
      <span className={shared['label']}>Icon</span>
      <IconTrigger pop={pop} value={value} onClick={() => toggleCleared(setQuery, pop.toggle)} />
      {pop.open && (
        <IconPopover
          pop={pop}
          query={query}
          onQuery={setQuery}
          names={names}
          value={value}
          onSelect={name => selectIcon(name, onChange, pop.close)}
        />
      )}
    </div>
  )
}

export default memo(IconPicker)
