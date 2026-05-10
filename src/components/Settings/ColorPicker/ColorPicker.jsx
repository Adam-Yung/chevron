import { useState, useEffect, useRef } from 'react'
import { HexColorPicker } from 'react-colorful'
import { ButtonCheck, ButtonX } from '../Buttons/Buttons'
import { BsDiagram2Fill, BsQuestionCircle, BsStars } from 'react-icons/bs'
import Color from '../../../functions/generationUtils/color'
import classes from './ColorPicker.module.css'
import getContrast from '../../../functions/generationUtils/getContrast'

function ColorPicker({ value, contrast, dependants, onChange, fullWidth }) {
  const [isOpened, setIsOpened] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => setLocalValue(value), [value])

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpened) return
    const onClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpened(false)
        setLocalValue(value)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [isOpened, value])

  const buttonColors = {
    _color: new Color(value),
    get normal() { return this._color },
    get hover() { return this._color.set({ 'lch.l': l => l > 30 ? l-5 : l+10 }) },
    get active() { return this._color.set({ 'lch.l': l => l > 30 ? l-10 : l+15 }) }
  }

  let contrastAlert = null
  if (contrast) {
    let Lc = null
    try {
      Lc = Math.round(getContrast(localValue, contrast.color))
    } catch (error) {/* pass */}

    if (Lc !== null) {
      const options = getLcAlertOptions(Lc)
      contrastAlert =
        <div className={`${classes['alert']} ${classes['alert-' + options.color]}`}>
          <span
            className={classes['contrast-example']}
            style={{ background: contrast.isBackground ? contrast.color : localValue }}>
            <BsStars color={contrast.isBackground ? localValue : contrast.color}/>
          </span>
          <span className={classes['alert-text']}>
            {options.score.charAt(0).toUpperCase() + options.score.slice(1)} contrast
          </span>
          <span className={classes['tooltip-trigger']} data-tip={`${contrast.isBackground ? 'This' : contrast.name} color contrasts on ${contrast.isBackground ? contrast.name : 'this'} color. Current contrast: ${Lc} Lc (${options.score}). APCA algorithm.`}>
            <BsQuestionCircle size='1.1em'/>
          </span>
        </div>
    }
  }

  let dependantsAlert = null
  if (dependants) {
    dependantsAlert =
      <div className={`${classes['alert']} ${classes['alert-neutral']}`}>
        <span className={classes['tooltip-trigger']} data-tip={`Dependants: ${dependants.join(', ')}`}>
          <BsDiagram2Fill size='1.5em'/>
        </span>
        <span className={classes['alert-text']}>Dependants</span>
        <span className={classes['tooltip-trigger']} data-tip={`Changing this color will also affect: ${dependants.join(', ')}`}>
          <BsQuestionCircle size='1.1em'/>
        </span>
      </div>
  }

  return (
    <div className={classes['picker-container']} ref={popoverRef}>
      <button
        type="button"
        className={classes['trigger-btn']}
        style={{
          background: colorToString(buttonColors.normal),
          color: getFontColor(buttonColors.normal),
          width: fullWidth ? '100%' : undefined,
        }}
        onClick={() => setIsOpened(o => !o)}>
          {value}
      </button>

      {isOpened && (
        <div className={classes['popover']}>
          <div className={classes['card']}>
            <HexColorPicker
              style={{ width: '100%' }}
              color={localValue}
              onChange={setLocalValue}/>
            <input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={e => setLocalValue(e.target.value)}
              className={classes['hex-input']}
              placeholder="Type color in HEX format"
            />
            <div className={classes['btn-row']}>
              <ButtonX
                className={classes['btn-half']}
                onClick={() => {
                  setIsOpened(false)
                  setLocalValue(value)
                }}/>
              <ButtonCheck
                className={classes['btn-half']}
                onClick={() => {
                  let newValue = false
                  try {
                    newValue = Color.parse(localValue)
                  } catch (error) {/* pass */}

                  if (newValue) {
                    onChange(localValue)
                    setIsOpened(false)
                  }
                }}/>
            </div>
            { contrastAlert }
            { dependantsAlert }
          </div>
        </div>
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
