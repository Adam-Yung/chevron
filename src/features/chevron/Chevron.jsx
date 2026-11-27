import { useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { SettingsContext, ThemeContext } from '../../settings/SettingsProvider'
import { dismissBootShell } from '../../app/bootShell'
import { stagesFor } from './parseStages'
import useViewportSize from '../search/useViewportSize'
import { BOUNCE_BEAT, LINE_BEAT } from './searchMotion'
import useChevronPainter from './useChevronPainter'
import classes from './Chevron.module.css'

// parseStages order: 0 chevron, 1 softened chevron, 2 search curve, 3 flat, 4 long flat bar, 5 edge line.
const STAGE_FOR_VIEW = { idle: 0, search: 2, macros: 4 }

// The canvas is sized off the viewport height so the search curve fits it; the other shapes keep their size off 2 x blobReach.
function useStages(settings, { width, height }) {
  const size = settings.chevron.size / 100
  const { topCurvature: top, bottomCurvature: bottom } = settings.chevron.quickLook
  return useMemo(() => stagesFor({ width, height, size, top, bottom }), [width, height, size, top, bottom])
}

// Into search the shape takes two beats, line then bounce; everything else is one plain morph.
function morphMessage(view, stage, duration) {
  if (view !== 'search') return { type: 'morph', stage, duration, ease: 'easeInOut' }
  const then = [{ stage, duration: duration * BOUNCE_BEAT, ease: 'spring' }]
  return { type: 'morph', stage: 5, duration: duration * LINE_BEAT, ease: 'easeInOut', then }
}

/** The central chevron: a canvas shape morphed per view. While searching it becomes the curve around the blob. */
export default function Chevron({ view, duration }) {
  const settings = useContext(SettingsContext)
  const theme = useContext(ThemeContext)
  const viewport = useViewportSize()
  const stages = useStages(settings, viewport)
  const stage = STAGE_FOR_VIEW[view] ?? 0
  const hostRef = useRef(null)
  const post = useChevronPainter(hostRef, { stages, stage, color: theme.chevron, thread: theme.seam, thickness: settings.chevron.thickness, viewport, onFirstFrame: dismissBootShell })

  // The shell's chevron is the idle shape; it must not outlive the idle view, even if the canvas never reports its first frame.
  useLayoutEffect(() => {
    if (view !== 'idle') dismissBootShell()
  }, [view])

  const shown = useRef(stage)
  useEffect(() => {
    if (shown.current === stage) return
    shown.current = stage
    post(morphMessage(view, stage, duration))
  }, [stage, view, duration, post])

  return <div ref={hostRef} className={classes.chevron} data-view={view} style={{ '--line-t': duration * LINE_BEAT + 'ms' }} />
}
