import { useEffect, useRef, useState } from 'react'
import styles from './controlStyles'

// Keeps what the user is typing as text so an empty or half-typed number ("", "-", "1.") is not forced to 0 mid-edit. In-range numbers
// apply live; anything else is left to blur, which snaps the text back to the stored value (clamping mid-typing would fight the user).
export default function NumberField({ value, min, max, step, onCommit }) {
  const [draft, setDraft] = useState(String(value))

  // External changes (reset, import) replace the text, but never while the field has focus: the user is typing, and a value arriving
  // then (a re-render right after the panel opens, or our own commit) would wipe or reformat the text under the caret.
  const inputRef = useRef(null)
  useEffect(() => {
    if (document.activeElement === inputRef.current) return
    setDraft(String(value))
  }, [value])

  const change = event => {
    const text = event.target.value
    setDraft(text)
    const n = Number(text)
    if (text.trim() === '' || !Number.isFinite(n) || n < min || n > max) return
    onCommit(n)
  }

  return (
    <input
      ref={inputRef}
      type="number"
      style={styles.input}
      value={draft}
      min={min}
      max={max}
      step={step}
      onChange={change}
      onBlur={() => setDraft(String(value))}
    />
  )
}
