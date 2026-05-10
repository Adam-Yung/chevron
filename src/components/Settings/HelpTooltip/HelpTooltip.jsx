import { BsQuestionCircle } from 'react-icons/bs'
import classes from './HelpTooltip.module.css'

function HelpTooltip({ title }) {
  return (
    <span className={classes['wrapper']} data-tooltip={title}>
      <BsQuestionCircle/>
    </span>
  )
}

export default HelpTooltip
