import { createPortal } from 'react-dom'
import shared from './Picker.module.css'

// The popover shell of the colour and icon pickers. `pop` is the picker's usePopover().
export default function PickerPopover({ pop, className, children }) {
  return createPortal(
    <>
      <div className={shared['backdrop']} onPointerDown={pop.onBackdropPointerDown} />
      {/* data-keep-focus: keys typed here must not reach the page-level shortcuts (Shift opens the macros menu). */}
      <div ref={pop.popoverRef} className={`${shared['popover']} ${className}`} style={pop.style} data-keep-focus="true" onKeyDown={pop.onKeyDown}>
        {children}
      </div>
    </>,
    document.getElementById('root')
  )
}
