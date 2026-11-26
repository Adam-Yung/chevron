// Inline styles for the setting controls. They live in JS rather than a CSS module because the control classes are plain objects
// that render themselves (see settingType.jsx) and carry no component of their own.
const field = {
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid rgba(128,128,128,0.35)',
  background: 'rgba(128,128,128,0.12)',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: '0.85em'
}

const styles = {
  select: { ...field, minWidth: 100, cursor: 'pointer', appearance: 'none', paddingRight: 26 },
  selectWrapper: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
  selectArrow: { position: 'absolute', right: 8, pointerEvents: 'none', opacity: 0.6 },
  switchTrack: {
    position: 'relative',
    display: 'inline-block',
    width: 40,
    height: 22,
    padding: 0,
    border: 0,
    borderRadius: 11,
    background: 'rgba(128,128,128,0.35)',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  },
  switchTrackChecked: { background: 'var(--accent, var(--primary, #3b82f6))' },
  switchThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s ease'
  },
  switchThumbChecked: { transform: 'translateX(18px)' },
  input: { ...field, minWidth: 80 },
  numberWrapper: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  suffix: { fontSize: '0.8em', opacity: 0.6 },
  alertDanger: {
    padding: '8px 12px',
    borderRadius: 8,
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    fontSize: '0.85em'
  }
}

export default styles
