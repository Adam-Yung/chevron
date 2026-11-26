import { memo } from 'react'
import { TbBan } from 'react-icons/tb'

/** A macro's icon from window.ICONS (bundled SVG strings), or a neutral mark when it has none. */
function MacroIcon({ icon, color, className }) {
  const svg = typeof icon === 'string' ? window.ICONS?.[icon] : null
  if (typeof svg === 'string' && svg.trimStart().startsWith('<svg')) {
    // ICONS comes from public/icons.js, which ships with the app; user config can only name a key in it, never supply markup.
    return <div className={className} aria-hidden='true' dangerouslySetInnerHTML={{ __html: svg }} />
  }
  return <div className={className} aria-hidden='true'><TbBan color={color} /></div>
}

export default memo(MacroIcon)
