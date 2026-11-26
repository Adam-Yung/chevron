import settings from '../../settings/schema'
import camelCaseToTitle from '../../lib/camelCaseToTitle'
import MacrosEditorBody from '../macros-editor/MacrosEditorBody'
import Category from './Category/Category'
import GeocodeRow from './GeocodeRow'
import classes from './Settings.module.css'

function PaneTitle({ children, subtitle }) {
  return (
    <>
      <h3 className={classes['paneTitle']}>{children}</h3>
      {subtitle && <p className={classes['paneSubtitle']}>{subtitle}</p>}
    </>
  )
}

const WEATHER_SUBTITLE = (
  <>
    Requires a free <a href="https://openweathermap.org/api" target="_blank" rel="noreferrer">OpenWeatherMap</a> API key.
    Enter your key, type a city, and click Resolve to auto-fill coordinates.
  </>
)

function CategoryFields({ path, hidden, current, onChange }) {
  return <Category path={path} hidden={hidden} template={settings.template} current={current} onChange={onChange} hideOwnTitle />
}

// The weather city is edited by GeocodeRow (it needs the Resolve button next to it), so the generic field is hidden here.
const WEATHER_CITY = 'weather.city'

export default function SettingsPane({ tab, hidden, current, onChange }) {
  if (tab === 'macros') {
    return (
      <>
        <PaneTitle subtitle="Edit macros, commands, and search engines. Saved to localStorage; bundled config is the fallback.">Macros</PaneTitle>
        <MacrosEditorBody />
      </>
    )
  }
  if (tab === 'weather') {
    return (
      <>
        <PaneTitle subtitle={WEATHER_SUBTITLE}>Weather</PaneTitle>
        <CategoryFields path="weather" hidden={[...hidden, WEATHER_CITY]} current={current} onChange={onChange} />
        <GeocodeRow current={current} onChange={onChange} />
      </>
    )
  }
  return (
    <>
      <PaneTitle>{camelCaseToTitle(tab, true)}</PaneTitle>
      <CategoryFields path={tab} hidden={hidden} current={current} onChange={onChange} />
    </>
  )
}
