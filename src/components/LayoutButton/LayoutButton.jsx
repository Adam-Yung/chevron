import gC from '../../functions/generationUtils/getClasses'
import classes from './LayoutButton.module.css'

function LayoutButton({ id, style, children, onClick, ...rest }) {
  if (!id) throw new Error('`id` must be defined for a LayoutButton')

  const isSettingsVisited = localStorage.getItem(id + 'Visited')
  function handleClick() {
    localStorage.setItem(id + 'Visited', true)
    onClick()
  }
  function handleKeyDown(e) {
    // Native <button>-style: Enter / Space activates.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      key='icon'
      role='button'
      tabIndex={0}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={gC(classes['container'], isSettingsVisited && classes['visited'])}
      {...rest}>
      { children }
    </div>
  )
}

export default LayoutButton