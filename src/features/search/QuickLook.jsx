import { memo, useContext, useMemo } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import { useUi } from '../../state/UiStore'
import useDestination from '../../search/useDestination'
import { feltColor } from '../../lib/getCssGradient'
import { BOUNCE_BEAT, LINE_BEAT, SPRING_CSS } from '../chevron/searchMotion'
import useViewportSize from './useViewportSize'
import InteractiveBackground from './InteractiveBackground'
import { blobPath, blobReach } from './blobPath'
import classes from './QuickLook.module.css'

const BEATS = { '--line-beat': LINE_BEAT, '--bounce-beat': BOUNCE_BEAT, '--spring': SPRING_CSS }

function useLabel(destination) {
  const settings = useContext(SettingsContext)
  if (!destination) return ''
  const isMacro = destination.kind === 'macro' || destination.kind === 'command'
  if (destination.kind === 'macro' && !settings.chevron.quickLook.showMacrosLabel) return ''
  return isMacro ? destination.label : destination.label ?? 'search'
}

// The blob on the left while searching: where Enter will go, in that destination's colours. Only the fill and label are here;
// the curve around them is the chevron itself (Chevron.jsx).
function QuickLook({ view }) {
  const settings = useContext(SettingsContext)
  const destination = useDestination()
  const forceEngine = useUi(s => s.forceEngine)
  const { width, height } = useViewportSize()
  const reach = blobReach(width, height)
  const { top, bottom } = { top: settings.chevron.quickLook.topCurvature, bottom: settings.chevron.quickLook.bottomCurvature }
  const path = useMemo(() => blobPath({ reach, height, top, bottom }), [reach, height, top, bottom])
  const label = useLabel(destination)
  const active = view === 'search'

  return (
    <div className={`felt ${classes.quicklook}`} data-active={active || undefined} data-forced={(active && forceEngine) || undefined}
      style={{ '--reach': reach + 'px', '--felt': feltColor(destination?.bgColor), ...BEATS }}>
      <div className={classes.fill} style={{ clipPath: `path('${path}')` }}>
        <InteractiveBackground width={reach} height={height} color='var(--felt-mixed)' textColor='var(--thread)'
          marqueeText={destination?.marquee ?? ''} paused={!active} />
        <div className={classes.label}>{label}</div>
      </div>
    </div>
  )
}

export default memo(QuickLook)
