import { BsGearFill, BsChevronRight, BsQuestionLg } from 'react-icons/bs'
import { RiMenu5Fill } from 'react-icons/ri'
import { useDispatch, useUi } from '../state/UiStore'
import { ui } from '../state/ui'
import LayoutButton from './LayoutButton'

/** The three corner buttons: shortcuts, settings, sites menu. */
export default function Corners() {
  const dispatch = useDispatch()
  const view = useUi(s => s.view)
  return (
    <>
      <LayoutButton id='cheatsheet' style={{ left: 0, top: 0 }} aria-label='Keyboard shortcuts'
        onClick={() => dispatch(ui.overlayOpened('cheatsheet'))}>
        <BsQuestionLg />
      </LayoutButton>
      <LayoutButton id='settings' style={{ right: 0, top: 0 }} aria-label='Open settings'
        onClick={() => dispatch(ui.overlayOpened('settings'))}>
        <BsGearFill />
      </LayoutButton>
      <LayoutButton id='macros-menu' style={{ right: 0, bottom: 0 }} aria-label={view === 'macros' ? 'Close sites menu' : 'Open sites menu'}
        aria-expanded={view === 'macros'} onClick={() => dispatch(view === 'macros' ? ui.macrosClosed() : ui.macrosToggled(false))}>
        {view === 'macros' ? <BsChevronRight /> : <RiMenu5Fill />}
      </LayoutButton>
    </>
  )
}
