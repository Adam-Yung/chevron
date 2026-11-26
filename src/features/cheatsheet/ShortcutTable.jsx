import { KEY_LABELS } from './shortcuts'
import classes from './Cheatsheet.module.css'

function Combo({ combo }) {
  return (
    <span className={classes['combo']}>
      {combo.map((key, i) => (
        <span key={i} className={classes['combo']}>
          {i > 0 && <span className={classes['plus']}>+</span>}
          <kbd className={classes['kbd']}>{KEY_LABELS[key] || key}</kbd>
        </span>
      ))}
    </span>
  )
}

export default function ShortcutTable({ section }) {
  return (
    <section className={classes['section']}>
      <h3 className={classes['sectionTitle']}>{section.title}</h3>
      <table className={classes['table']}>
        <tbody>
          {section.rows.map((row, i) => (
            <tr key={i} className={classes['row']}>
              <td className={classes['keysCell']}>
                {row.keys.map((combo, j) => (
                  <div key={j} className={classes['comboLine']}><Combo combo={combo} /></div>
                ))}
              </td>
              <td className={classes['labelCell']}>{row.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
