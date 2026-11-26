import { getPropertyByPath } from '../../../lib/propertyByPath'
import camelCaseToTitle from '../../../lib/camelCaseToTitle'
import classes from './Property.module.css'

function Property({ template, current, path, isThemeColor=false, onChange }) {
  const type = getPropertyByPath(template, path)
  const title = type.label ?? camelCaseToTitle(path.slice(path.lastIndexOf('.') + 1), !isThemeColor)
  const description = type.description

  return (
    <div className={classes['row']}>
      <div className={classes['text']}>
        <div className={classes['title']}>{title}</div>
        {description && <div className={classes['description']}>{description}</div>}
      </div>
      <div className={classes['control']}>
        {type.render(current, path, onChange)}
      </div>
    </div>
  )
}

export default Property
