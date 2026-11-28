import gC from '../lib/getClasses'
import classes from './LayoutButton.module.css'

function visit(id, onClick) {
  localStorage.setItem(id + 'Visited', true)
  onClick()
}

function LayoutButton({ id, style, children, onClick, ...rest }) {
  if (!id) throw new Error('`id` must be defined for a LayoutButton')

  const isSettingsVisited = localStorage.getItem(id + 'Visited')
  return (
    <button
      type='button'
      style={style}
      onClick={() => visit(id, onClick)}
      className={gC(classes['container'], isSettingsVisited && classes['visited'])}
      {...rest}>
      { children }
    </button>
  )
}

export default LayoutButton
