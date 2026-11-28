/** A `visibilitychange` listener that runs `callback` only when the change was to visible. */
export const whenTabVisible = callback => () => {
  if (document.visibilityState === 'visible') callback()
}
