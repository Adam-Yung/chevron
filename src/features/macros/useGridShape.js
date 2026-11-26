import { useEffect, useState } from 'react'
import { isTouch } from '../../lib/isMobile'

const portraitQuery = () => window.matchMedia?.('(orientation: portrait)')

/**
 * The configured grid, transposed on portrait touch screens (more rows, fewer columns) so cards stay a usable size. Capacity per
 * page is unchanged, so paging behaves the same.
 */
export default function useGridShape(columns, rows) {
  const [portrait, setPortrait] = useState(() => Boolean(portraitQuery()?.matches))
  useEffect(() => {
    const mql = portraitQuery()
    if (!mql) return undefined
    const onChange = e => setPortrait(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  if (!(portrait && isTouch) || columns === rows) return { cols: columns, rows }
  return { cols: Math.min(columns, rows), rows: Math.max(columns, rows) }
}
