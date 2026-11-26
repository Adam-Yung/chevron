import { memo, useContext, useMemo } from 'react'
import { SettingsContext, ThemeContext } from '../../settings/SettingsProvider'
import { useUi } from '../../state/UiStore'
import useDestination from '../../search/useDestination'
import useViewportSize from './useViewportSize'
import InteractiveBackground from './InteractiveBackground'
import { blobPath } from './blobPath'
import classes from './QuickLook.module.css'

function blobReach(width, height) {
  // Same measure as --chev in global.css: half the height in landscape, 40% of the width in portrait.
  return width < height ? width * 0.4 : height * 0.5
}

function useLabel(destination) {
  const settings = useContext(SettingsContext)
  if (!destination) return ''
  const isMacro = destination.kind === 'macro' || destination.kind === 'command'
  if (destination.kind === 'macro' && !settings.chevron.quickLook.showMacrosLabel) return ''
  return isMacro ? destination.label : destination.label ?? 'search'
}

/**
 * The blob on the left while searching: where Enter will go, in that destination's colours. The shape is fixed per viewport and
 * only translated in and out, so the animation never repaints the clipped marquee.
 */
function QuickLook({ view }) {
  const settings = useContext(SettingsContext)
  const theme = useContext(ThemeContext)
  const destination = useDestination()
  const forceEngine = useUi(s => s.forceEngine)
  const { width, height } = useViewportSize()
  const reach = blobReach(width, height)
  const thickness = settings.chevron.thickness
  const { top, bottom } = { top: settings.chevron.quickLook.topCurvature, bottom: settings.chevron.quickLook.bottomCurvature }
  const path = useMemo(() => blobPath({ reach, height, top, bottom }), [reach, height, top, bottom])
  const label = useLabel(destination)
  const active = view === 'search'

  return (
    <div className={classes.quicklook} data-active={active || undefined} data-forced={(active && forceEngine) || undefined}
      style={{ '--reach': reach + 'px', '--thickness': thickness + 'px', '--text': destination?.textColor }}>
      <div className={classes.fill} style={{ clipPath: `path('${path.fill}')` }}>
        <InteractiveBackground width={reach} height={height} color={destination?.bgColor} textColor={destination?.textColor}
          marqueeText={destination?.marquee ?? ''} paused={!active} />
        <div className={classes.label}>{label}</div>
      </div>
      <svg className={classes.outline} width={reach + thickness} height={height} aria-hidden='true'>
        <path d={path.stroke} fill='none' stroke={theme.chevron} strokeWidth={thickness} strokeLinecap='round' />
      </svg>
    </div>
  )
}

export default memo(QuickLook)
