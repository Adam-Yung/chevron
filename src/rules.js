// non "keypressable" keys which have some actions
const activeKeys = new Map([
  ['QueryField', new Set([
    'Backspace', 
    'ArrowRight', 
    'ArrowLeft'
  ])],
  ['Suggestions', new Set([
    'ArrowUp', 
    'ArrowDown'
  ])]
])

// allowed modes for query field functionality
const allowedModes = new Map([
  ['QueryField', new Set([
    'default', 
    'searching'
  ])],
  ['Chevron', new Set([
    'default',
    'opened'
  ])],
  ['Suggestions', new Set([
    'searching'
  ])],
  ['Slider', new Set([
    'opened'
  ])],
  // Phase 8a: typing in `opened` mode appends to `macroFilter` instead of
  // landing in the QueryField. Lives next to the other actor sets so the
  // rule registry stays in one place.
  ['MacroFilter', new Set([
    'opened'
  ])]
])

export { activeKeys, allowedModes }