import { useContext } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import Chevron from '../chevron/Chevron'
import QuickLook from '../search/QuickLook'
import MacrosLayer from '../macros/MacrosLayer'
import classes from './Stage.module.css'

/**
 * The animated backdrop. Every layer is a function of `view` and animates toward it with CSS transitions, which the browser
 * retargets when the view changes mid-way: nothing here waits for an animation to end.
 */
export default function Stage({ view, onOpenMacro }) {
  const settings = useContext(SettingsContext)
  const speed = Math.max(0, Number(settings.general.animationSpeed) || 0)
  return (
    <div className={classes.stage} data-view={view} style={{ '--t': speed + 'ms' }}>
      <QuickLook view={view} />
      <Chevron view={view} duration={speed} />
      <MacrosLayer view={view} onOpenMacro={onOpenMacro} />
    </div>
  )
}
