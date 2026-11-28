import useMediaQuery from '../../app/useMediaQuery'
import { isTouch } from '../../lib/isMobile'

// The configured grid, transposed on portrait touch screens so cards stay a usable size. Capacity per page is unchanged.
export default function useGridShape(columns, rows) {
  const portrait = useMediaQuery('(orientation: portrait)')
  if (!(portrait && isTouch) || columns === rows) return { cols: columns, rows }
  return { cols: Math.min(columns, rows), rows: Math.max(columns, rows) }
}
