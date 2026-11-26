import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import classes from './IconPicker.module.css'
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

function IconPicker({ value, onChange }) {
  const pop = usePopover()
  const [query, setQuery] = useState('')
  const names = useMemo(() => {
    const q = query.trim().toLowerCase()
    return iconNames().filter(name => name.toLowerCase().includes(q))
  }, [query])

  const select = name => {
    onChange(name)
    pop.close()
  }

  const toggle = () => {
    setQuery('')
    pop.toggle()
  }

  const currentSvg = value && window.ICONS?.[value]

  return (
    <div className={classes['root']}>
      <span className={classes['label']}>Icon</span>
      <button
        ref={pop.triggerRef}
        type="button"
        className={classes['trigger']}
        onClick={toggle}
        aria-expanded={pop.open}
        title={value || 'Pick an icon'}
        aria-label={value ? `Icon: ${value}. Click to change.` : 'Pick an icon'}
      >
        {currentSvg
          ? <span className={classes['svg-wrap']} dangerouslySetInnerHTML={{ __html: currentSvg }} />
          : <span className={classes['placeholder']}>?</span>}
        <span className={classes['trigger-name']}>{value || <em>none</em>}</span>
      </button>

      {pop.open && createPortal(
        <>
          <div className={classes['backdrop']} onPointerDown={pop.onBackdropPointerDown} />
          {/* data-keep-focus: typing in the search box must not reach the page-level shortcuts. */}
          <div ref={pop.popoverRef} className={classes['popover']} style={pop.style} data-keep-focus="true" onKeyDown={pop.onKeyDown}>
            <input
              className={classes['search']}
              type="text"
              placeholder="Search icons…"
              aria-label="Search icons"
              value={query}
              autoFocus
              onChange={e => setQuery(e.target.value)}
            />
            <div className={classes['grid']}>
              <IconGrid names={names} query={query} value={value} onSelect={select} />
            </div>
            <div className={classes['hint']}>
              Add icons: <code>node scripts/add-icon.mjs domain.com --write</code>
              <br />or paste SVG markup into <code>public/icons.js</code>
            </div>
          </div>
        </>,
        document.getElementById('root')
      )}
    </div>
  )
}

export default memo(IconPicker)
