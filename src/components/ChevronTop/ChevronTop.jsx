import Time from '../Time/Time'
import classes from './ChevronTop.module.css'

// Phase 8b: layout shell sitting in the Chevron's top wrapper. Hosts
// the clock today; Phase 8d will mount the Weather widget alongside it.
//
// Kept intentionally thin so that the future weather addition is
// purely additive (drop the `<Weather/>` Suspense child next to
// `<Time/>` and the flex row recenters automatically).
function ChevronTop() {
  return (
    <div className={classes['top']}>
      <Time />
    </div>
  )
}

export default ChevronTop
