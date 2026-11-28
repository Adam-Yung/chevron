import { memo, useMemo } from 'react'
import classes from './MacrosEditor.module.css'
import { bgPreviewCss } from './colorHelpers'

// Collapsed summary line of a macro or engine row; `children` are the row actions.
function RowHeader({ bgColor, title, detail, isOpen, onToggle, children }) {
  const swatchStyle = useMemo(() => ({ background: bgPreviewCss(bgColor) }), [bgColor])
  return (
    <div className={classes['rowHeader']}>
      <span className={classes['swatch']} style={swatchStyle} aria-hidden="true" />
      <button type="button" className={classes['rowTitle']} onClick={onToggle} aria-expanded={isOpen}>
        <span className={classes['rowName']}>{title}</span>
        {detail && <span className={classes['rowDetail']}>{detail}</span>}
        <span className={classes['rowChevron']} aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
      </button>
      <span className={classes['rowActions']}>{children}</span>
    </div>
  )
}

export default memo(RowHeader)
