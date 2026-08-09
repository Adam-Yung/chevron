import gC from '../../functions/generationUtils/getClasses'
import classes from './LayoutButton.module.css'

function LayoutButton({ id, style, children, onClick, ...rest }) {
  if (!id) throw new Error('`id` must be defined for a LayoutButton')

  const isSettingsVisited = localStorage.getItem(id + 'Visited')
  function handleClick() {
    localStorage.setItem(id + 'Visited', true)
    onClick()
  }

  return (
    <button
      type='button'
      style={style}
      onClick={handleClick}
      className={gC(classes['container'], isSettingsVisited && classes['visited'])}
      {...rest}>
      { children }
    </button>
  )
}

export default LayoutButton
