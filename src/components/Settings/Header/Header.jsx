import { ButtonCheck, ButtonX } from '../Buttons/Buttons'
import classes from './Header.module.css'

function Header({ title, isPlaceholder=false, onApply, onCancel }) {
  return (
    <div className={classes['outer']} style={isPlaceholder ? { visibility: 'hidden' } : { maxHeight: 0 }}>
      <div className={classes['bar']}>
        <ButtonCheck onClick={onApply}/>
        <h3 className={classes['title']}>{title}</h3>
        <ButtonX onClick={onCancel}/>
      </div>
    </div>
  )
}

export default Header
