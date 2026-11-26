// Every label must end at a dot and labels cannot contain dots, so the matcher never has more than one way to split the host:
// matching stays linear. The previous pattern nested quantifiers (`([a-z\d]([a-z\d-]*[a-z\d])*\.)+`) and backtracked
// exponentially on a long word without a dot: about 30 typed letters froze the tab, since this runs on every keystroke.
const URL_PATTERN = new RegExp(
  '^([a-z][a-z\\d+.-]*:\\/\\/)?' +
  '((?:[a-z\\d](?:[a-z\\d-]{0,61}[a-z\\d])?\\.)+[a-z]{2,63}|(?:\\d{1,3}\\.){3}\\d{1,3})' +
  '(:\\d{1,5})?' +
  '(\\/[-a-z\\d%_.~+]*)*' +
  '(\\?[;&a-z\\d%_.~+=-]*)?' +
  '(#[-a-z\\d_]*)?$',
  'i'
)

/** Whether `url` looks like a web address (scheme optional). */
function isValidUrl(url) {
  return typeof url === 'string' && url.length <= 2048 && URL_PATTERN.test(url)
}

export default isValidUrl
