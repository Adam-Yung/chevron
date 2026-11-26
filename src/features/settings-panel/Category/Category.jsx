import { Fragment, useState } from 'react'
import { FiChevronRight } from 'react-icons/fi'
import { BsSun, BsMoon } from 'react-icons/bs'
import Property from '../Property/Property'
import { Theme } from '../../../settings/settingTypes'
import { getPropertyByPath } from '../../../lib/propertyByPath'
import classes from './Category.module.css'

function ThemeControl({ selected, onToggle }) {
  return (
    <label className={classes['theme-switch']} onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={selected === 'light'} onChange={onToggle} className={classes['theme-checkbox']} aria-label="Edit light colours" />
      <span className={`${classes['switch-track']} ${selected === 'light' ? classes['switch-light'] : ''}`}>
        <BsSun size="0.85em" />
        <BsMoon size="0.85em" />
      </span>
    </label>
  )
}

function CategoryHeader({ name, nested, isTheme, isOpened, visibility, hideOwnTitle, scheme, onToggleOpen, onToggleScheme }) {
  const headingClass = `${classes['heading']} ${nested ? classes['nested'] : ''}`
  return (
    <div
      onClick={nested ? onToggleOpen : undefined}
      className={classes['header']}
      style={{ display: visibility ? 'flex' : 'none', cursor: nested ? 'pointer' : undefined }}>
      {!hideOwnTitle && <span className={headingClass} style={{ textTransform: isTheme ? undefined : 'capitalize' }}>{name}</span>}
      {isTheme && <ThemeControl selected={scheme} onToggle={onToggleScheme} />}
      {nested && (
        <button type="button" className={classes['chevron-btn']} aria-expanded={isOpened} aria-label={`${isOpened ? 'Collapse' : 'Expand'} ${name}`}>
          <FiChevronRight size="1.5em" style={isOpened ? { transform: 'rotate(90deg)' } : null} />
        </button>
      )}
    </div>
  )
}

// Hidden entries still render (display: none) because colour dependants need every sibling mounted to receive a propagated change.
function Items({ template, current, path, isThemeColor = false, hidden, onChange }) {
  const items = getPropertyByPath(template, path)
  let seenVisible = false
  return Object.keys(items).map(item => {
    const finalPath = path + '.' + item
    const visible = !hidden.includes(finalPath)
    const divider = visible && seenVisible
    seenVisible = seenVisible || visible
    return (
      <Fragment key={item}>
        {divider && <hr className={classes['divider']} />}
        {'render' in items[item]
          ? (
            <div className={classes['list-item']} style={{ display: visible ? undefined : 'none' }}>
              <Property template={template} current={current} path={finalPath} isThemeColor={isThemeColor} onChange={onChange} />
            </div>
          )
          : <Category template={template} current={current} path={finalPath} hidden={hidden} visibility={visible} onChange={onChange} />}
      </Fragment>
    )
  })
}

function Category({ path, template, current, hidden, onChange, visibility = true, hideOwnTitle = false }) {
  const pathArray = path.split('.')
  const nested = pathArray.length > 1
  const name = pathArray[pathArray.length - 1]
  const [isOpened, setIsOpened] = useState(!nested)
  const isTheme = getPropertyByPath(template, path) instanceof Theme
  const [scheme, setScheme] = useState(isTheme ? (document.body.getAttribute('data-color-scheme') || 'light') : '')
  const itemsPath = scheme ? path + '.' + scheme : path

  return <>
    {(!hideOwnTitle || nested || isTheme) && (
      <CategoryHeader
        {...{ name, nested, isTheme, isOpened, visibility, hideOwnTitle, scheme }}
        onToggleOpen={() => setIsOpened(open => !open)}
        onToggleScheme={() => setScheme(s => (s === 'light' ? 'dark' : 'light'))} />
    )}
    {isOpened && (
      <div className={`${classes['list']} ${nested ? classes['list-nested'] : ''}`}>
        <Items {...{ template, current, path: itemsPath, isThemeColor: isTheme, hidden, onChange }} />
      </div>
    )}
  </>
}

export default Category
