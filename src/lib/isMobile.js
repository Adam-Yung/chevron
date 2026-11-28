// Lightweight mobile detection used in place of `react-device-detect`,
// which was pulling ~30KB into the bundle just for this single check.
// Errs on the side of "desktop": only flips true for clear UA hints.
const MOBILE_UA_REGEX = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i

const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''
const uaData = (typeof navigator !== 'undefined' && navigator.userAgentData) || null

const isMobile = uaData?.mobile === true || MOBILE_UA_REGEX.test(ua)

// Coarse primary pointer: the real input modality, falling back to the UA guess where matchMedia is missing.
export const isTouch =
  (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
    ? window.matchMedia('(pointer: coarse)').matches
    : isMobile
