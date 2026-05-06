import { useMemo } from 'react'
import { useStateSelector } from '../../contexts/Store'
import { AnimatePresence, motion } from 'framer-motion'
import { pinnedMacros, score } from '../MacrosMenu/MacrosMenu'
import classes from './MacroFilterPill.module.css'

// Phase 8c: floating pill that appears above the macros menu whenever the
// user has typed characters into the filter buffer. Shows the current query
// and result count so the user knows what they typed without looking away
// from the card grid. Marked data-keep-focus so the QueryField focus grabber
// leaves it alone.
function MacroFilterPill() {
  const macroFilter = useStateSelector(store => store.macroFilter)

  const resultCount = useMemo(() => {
    const needle = macroFilter.trim().toLowerCase()
    if (!needle) return pinnedMacros.length
    return pinnedMacros.filter(m => score(m, needle) > 0).length
  }, [macroFilter])

  const visible = macroFilter.length > 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={classes['pill']}
          data-keep-focus="true"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}>
          <span className={classes['query']}>{macroFilter}</span>
          <span className={classes['sep']}>·</span>
          <span className={classes['count']}>
            {resultCount === 0
              ? 'no matches'
              : `${resultCount} result${resultCount === 1 ? '' : 's'}`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MacroFilterPill
