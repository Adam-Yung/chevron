import { FiCheck, FiX } from 'react-icons/fi'
import classes from './Buttons.module.css'

export function ButtonCheck({ title, onClick, className, ...rest }) {
  return (
    <button type="button" className={`${classes['btn']} ${classes['primary']} ${className || ''}`} onClick={onClick} {...rest}>
      { title || <FiCheck size='1.5em'/> }
    </button>
  )
}
export function ButtonX({ title, onClick, className, ...rest }) {
  return (
    <button type="button" className={`${classes['btn']} ${classes['danger']} ${className || ''}`} onClick={onClick} {...rest}>
      { title || <FiX size='1.5em'/> }
    </button>
  )
}
