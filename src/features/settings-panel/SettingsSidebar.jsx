import { FiEye, FiEyeOff, FiSettings, FiLayout, FiZap, FiSearch, FiGrid, FiCommand, FiRotateCcw, FiTrash2, FiCloud } from 'react-icons/fi'
import camelCaseToTitle from '../../lib/camelCaseToTitle'
import classes from './Settings.module.css'

const TAB_ICONS = {
  general: FiSettings,
  appearance: FiLayout,
  chevron: FiZap,
  query: FiSearch,
  menu: FiGrid,
  macros: FiCommand,
  weather: FiCloud
}

// Both actions reload because the stores they clear are read once at import; a reload is the one path that cannot leave stale state.
function clearAndReload(question, key) {
  if (!confirm(question)) return
  localStorage.removeItem(key)
  location.reload()
}

function SidebarAction({ icon, onClick, danger, title, children }) {
  return (
    <button type="button" className={`${classes['sidebarAction']}${danger ? ' ' + classes['danger'] : ''}`} onClick={onClick} title={title}>
      <span className={classes['tabIcon']}>{icon}</span>
      {children}
    </button>
  )
}

export default function SettingsSidebar({ tabs, activeTab, onSelect, showHidden, onToggleHidden }) {
  return (
    <nav className={classes['sidebar']} aria-label="Settings sections">
      {tabs.map(tab => {
        const Icon = TAB_ICONS[tab]
        const isActive = tab === activeTab
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${classes['tab']}${isActive ? ' ' + classes['active'] : ''}`}
            onClick={() => onSelect(tab)}
          >
            {Icon && <span className={classes['tabIcon']}><Icon /></span>}
            {camelCaseToTitle(tab, true)}
          </button>
        )
      })}
      <hr className={classes['sidebarDivider']} />
      <SidebarAction
        icon={showHidden ? <FiEye /> : <FiEyeOff />}
        onClick={onToggleHidden}
        title={showHidden ? 'Hide advanced fields' : 'Show advanced fields'}
      >
        {showHidden ? 'Hide advanced' : 'Show advanced'}
      </SidebarAction>
      <SidebarAction icon={<FiRotateCcw />} onClick={() => clearAndReload('Reset all settings to defaults? This will reload the page.', 'settings')}>
        Reset settings
      </SidebarAction>
      <SidebarAction icon={<FiTrash2 />} danger onClick={() => clearAndReload('Clear search history? This will reload the page.', 'history')}>
        Clean history
      </SidebarAction>
    </nav>
  )
}
