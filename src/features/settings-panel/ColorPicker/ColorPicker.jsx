import { useState, useEffect, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import { ButtonCheck, ButtonX } from '../Buttons/Buttons'
import { BsDiagram2Fill, BsQuestionCircle, BsStars } from 'react-icons/bs'
import Color from '../../../lib/color'
import classes from './ColorPicker.module.css'
import getContrast from '../../../lib/getContrast'

function contrastLevel(value, other) {
  try {
    return Math.round(getContrast(value, other))
  } catch {
    return null
  }
}

function ContrastAlert({ contrast, value }) {
  if (!contrast) return null
  const Lc = contrastLevel(value, contrast.color)
  if (Lc === null) return null

  const options = getLcAlertOptions(Lc)
  return (
    <div className={`${classes['alert']} ${classes['alert-' + options.color]}`}>
      <span
        className={classes['contrast-example']}
        style={{ background: contrast.isBackground ? contrast.color : value }}>
        <BsStars color={contrast.isBackground ? value : contrast.color}/>
      </span>
      <span className={classes['alert-text']}>
        {options.score.charAt(0).toUpperCase() + options.score.slice(1)} contrast
      </span>
      <span className={classes['tooltip-trigger']} data-tip={`${contrast.isBackground ? 'This' : contrast.name} color contrasts on ${contrast.isBackground ? contrast.name : 'this'} color. Current contrast: ${Lc} Lc (${options.score}). APCA algorithm.`}>
        <BsQuestionCircle size='1.1em'/>
      </span>
    </div>
  )
}

function DependantsAlert({ dependants }) {
  if (!dependants) return null
  return (
    <div className={`${classes['alert']} ${classes['alert-neutral']}`}>
      <span className={classes['tooltip-trigger']} data-tip={`Dependants: ${dependants.join(', ')}`}>
        <BsDiagram2Fill size='1.5em'/>
      </span>
      <span className={classes['alert-text']}>Dependants</span>
      <span className={classes['tooltip-trigger']} data-tip={`Changing this color will also affect: ${dependants.join(', ')}`}>
        <BsQuestionCircle size='1.1em'/>
      </span>
    </div>
  )
}

function PickerCard({ cardRef, draft, onDraft, onCancel, onConfirm, contrast, dependants }) {
  return (
    <div className={classes['popover']}>
      <div className={classes['card']} ref={cardRef}>
        <HexColorPicker
          style={{ width: '100%' }}
          color={draft}
          onChange={onDraft}/>
        <input
          type="text"
          value={draft}
          onChange={e => onDraft(e.target.value)}
          className={classes['hex-input']}
          placeholder="Type color in HEX format"
        />
        <div className={classes['btn-row']}>
          <ButtonX className={classes['btn-half']} onClick={onCancel}/>
          <ButtonCheck className={classes['btn-half']} onClick={onConfirm}/>
        </div>
        <ContrastAlert contrast={contrast} value={draft}/>
        <DependantsAlert dependants={dependants}/>
      </div>
    </div>
  )
}

function discardEdit({ value, setIsOpened, setLocalValue }) {
  setIsOpened(false)
  setLocalValue(value)
}

function outsidePressListener(ref, onOutside) {
  return event => {
    if (ref.current && !ref.current.contains(event.target)) onOutside()
  }
}

// An unparsable draft is refused and the popover stays open.
function confirmEdit(draft, { onChange, setIsOpened }) {
  try {
    Color.parse(draft)
  } catch {
    return
  }
  onChange(draft)
  setIsOpened(false)
}

function ColorPicker({ value, contrast, dependants, onChange, fullWidth }) {
  const [isOpened, setIsOpened] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const popoverRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => setLocalValue(value), [value])

  // The popover opens below its swatch and may extend past the scrolling pane, so bring it into view.
  useEffect(() => {
    if (isOpened) cardRef.current?.scrollIntoView({ block: 'nearest' })
  }, [isOpened])

  // A press anywhere else cancels the edit, like the cross button.
  useEffect(() => {
    if (!isOpened) return
    const onPress = outsidePressListener(popoverRef, () => discardEdit({ value, setIsOpened, setLocalValue }))
    document.addEventListener('mousedown', onPress)
    return () => document.removeEventListener('mousedown', onPress)
  }, [isOpened, value])

  const swatch = new Color(value)

  return (
    <div className={classes['picker-container']} ref={popoverRef}>
      <button
        type="button"
        className={classes['trigger-btn']}
        style={{
          background: colorToString(swatch),
          color: getFontColor(swatch),
          width: fullWidth ? '100%' : undefined,
        }}
        onClick={() => setIsOpened(o => !o)}>
          {value}
      </button>

      {isOpened && (
        <PickerCard
          cardRef={cardRef}
          draft={localValue}
          onDraft={setLocalValue}
          onCancel={() => discardEdit({ value, setIsOpened, setLocalValue })}
          onConfirm={() => confirmEdit(localValue, { onChange, setIsOpened })}
          contrast={contrast}
          dependants={dependants}/>
      )}
    </div>
  )
}

function colorToString(color) {
  return color.toString({format: 'hex'})
}
function getFontColor(color) {
  return getContrast(color, '#eee', '#333')
}
function getLcAlertOptions(Lc) {
  const structure = [
    {from: 80, score: 'perfect', color: 'success'},
    {from: 60, score: 'good', color: 'success'},
    {from: 30, score: 'normal', color: 'neutral'},
    {from: 15, score: 'poor', color: 'warning'},
    {from: 0, score: 'bad', color: 'danger'}
  ]
  for (let i=0; i < structure.length; i++) {
    if (Lc >= structure[i].from) return structure[i]
  }
}

export default ColorPicker
