import useMediaQuery from '../../app/useMediaQuery'

/** Whether the system asks for less motion. */
export default function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
