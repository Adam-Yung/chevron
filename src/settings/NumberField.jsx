import { useEffect, useRef, useState } from 'react'
import styles from './controlStyles'

// In-range numbers apply live; partial or out-of-range text waits for blur, because clamping mid-typing fights the user.
function typeNumber(text, { min, max, setDraft, onCommit }) {
  setDraft(text)
  const n = Number(text)
  if (text.trim() === '' || !Number.isFinite(n) || n < min || n > max) return
  onCommit(n)
}

// Keeps the typed text as a draft so an empty or half-typed number ("", "-", "1.") is not forced to 0 mid-edit.
export default function NumberField({ value, min, max, step, onCommit }) {
  const [draft, setDraft] = useState(String(value))

  // External changes replace the text, but never while focused: that would wipe or reformat it under the caret.
  const inputRef = useRef(null)
  useEffect(() => {
    if (document.activeElement === inputRef.current) return
    setDraft(String(value))
  }, [value])

  return (
    <input
      ref={inputRef}
      type="number"
      style={styles.input}
      value={draft}
      min={min}
      max={max}
      step={step}
      onChange={event => typeNumber(event.target.value, { min, max, setDraft, onCommit })}
      onBlur={() => setDraft(String(value))}
    />
  )
}
