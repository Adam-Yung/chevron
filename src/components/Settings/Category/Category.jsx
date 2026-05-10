import { useState } from 'react'
import Property from '../Property/Property'
import { FiChevronRight } from 'react-icons/fi'
import { BsSun, BsMoon } from 'react-icons/bs'
import { Theme } from '../../../../settings/settingTypes'
import { getPropertyByPath } from '../../../functions/dataUtils/propertyByPath'
import classes from './Category.module.css'

function Category({ path, template, current, hidden, onChange, visibility=true, hideOwnTitle=false }) {
  const pathArray = path.split('.')

  const nested = pathArray.length > 1
  const name = pathArray[pathArray.length-1]
  const [isOpened, setIsOpened] = useState(!nested)
  const isTheme = getPropertyByPath(template, path) instanceof Theme
  const [innerPath, setInnerPath] = useState(isTheme ? (document.body.getAttribute('data-color-scheme') || 'light') : '')
  const itemsPath = innerPath ? path + '.' + innerPath : path

  const showHeader = !hideOwnTitle || nested || isTheme

  return <>
    {showHeader && <div
      onClick={nested ? () => setIsOpened(o => !o) : null}
      className={classes['header']}
      style={{ display: visibility ? 'flex' : 'none', cursor: nested ? 'pointer' : undefined }}>
        {!hideOwnTitle && <span className={`${classes['heading']} ${nested ? classes['nested'] : ''}`} style={{ textTransform: isTheme ? undefined : 'capitalize' }}>
            {name}
        </span>}
        { isTheme && <ThemeControl selected={innerPath} onSetSelected={() => setInnerPath(si => si === 'light' ? 'dark' : 'light')}/> }
        {
          nested && <button type="button" className={classes['chevron-btn']}>
              <FiChevronRight
                size='1.5em'
                style={isOpened ? { transform: 'rotate(90deg)' } : null}/>
            </button>
        }
    </div>}
    {
      isOpened && <div
          className={`${classes['list']} ${nested ? classes['list-nested'] : ''}`}>
            <Items {...{template, current, path: itemsPath, isThemeColor: isTheme, hidden, onChange}}/>
        </div>
    }
  </>
}

function Items({ template, current, path, isThemeColor=false, hidden, onChange }) {
  const nested = path.indexOf('.') !== -1
  const items = getPropertyByPath(template, path)

  const jsx = []
  for (const item in items) {
    const finalPath = path + '.' + item
    const visible = !hidden.includes(finalPath)

    visible && jsx.push(<hr key={item+'d'} className={classes['divider']}/>)

    if ('render' in items[item]) {
      jsx.push(
        <div key={item} className={classes['list-item']} style={{ display: visible ? undefined : 'none' }}>
          <Property
            template={template}
            current={current}
            path={finalPath}
            isThemeColor={isThemeColor}
            onChange={onChange}/>
        </div>)
    } else {
      jsx.push(
        <Category
          key={item}
          template={template}
          current={current}
          path={finalPath}
          hidden={hidden}
          visibility={visible}
          onChange={onChange}/>)
    }
  }
  jsx.shift()

  return jsx
}

function ThemeControl({ selected, onSetSelected }) {
  return (
    <label className={classes['theme-switch']} onClick={e => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={selected === 'light'}
        onChange={onSetSelected}
        className={classes['theme-checkbox']}
      />
      <span className={`${classes['switch-track']} ${selected === 'light' ? classes['switch-light'] : ''}`}>
        <BsSun size='0.85em'/>
        <BsMoon size='0.85em'/>
      </span>
    </label>
  )
}

export default Category
