import { getPropertyByPath } from '../../../functions/dataUtils/propertyByPath'
import camelCaseToTitle from '../../../functions/dataUtils/camelCaseToTitle'
import classes from './Property.module.css'

function Property({ template, current, path, isThemeColor=false, onChange }) {
  const title = camelCaseToTitle(path.slice(path.lastIndexOf('.') + 1), !isThemeColor)
  const type = getPropertyByPath(template, path)
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
