import { useContext, useEffect, useMemo, useRef } from 'react'
import { SettingsContext, ThemeContext } from '../../settings/SettingsProvider'
import parseStages from './parseStages'
import useChevronPainter from './useChevronPainter'
import classes from './Chevron.module.css'

// parseStages order: 0 chevron, 1 softened chevron, 2 vertical edge line, 3 flat, 4 long flat bar.
const STAGE_FOR_VIEW = { idle: 0, search: 2, macros: 4 }

/** The central chevron: a canvas shape morphed per view, slid to the left edge while searching. */
export default function Chevron({ view, duration }) {
  const settings = useContext(SettingsContext)
  const theme = useContext(ThemeContext)
  const size = settings.chevron.size / 100
  const stages = useMemo(() => parseStages(size), [size])
  const stage = STAGE_FOR_VIEW[view] ?? 0
  const hostRef = useRef(null)
  const post = useChevronPainter(hostRef, { stages, stage, color: theme.chevron, thickness: settings.chevron.thickness })

  const shown = useRef(stage)
  useEffect(() => {
    if (shown.current === stage) return
    shown.current = stage
    post({ type: 'morph', stage, duration, ease: 'easeInOut' })
  }, [stage, duration, post])

  return <div ref={hostRef} className={classes.chevron} data-view={view} />
}
