// What the cheatsheet tells the user. Keep in step with src/input/keyRouter.js: a shortcut that is not listed here is
// invisible to users, and a listed one that does not exist is a lie.
//
// A row's `keys` is a list of alternatives; each alternative is one combo, written as the keys pressed together or in order.
export const SHORTCUT_SECTIONS = [
  {
    title: 'Search',
    rows: [
      { keys: [['type anywhere']], label: 'Just start typing: the search field takes your keys' },
      { keys: [['Enter']], label: 'Open the highlighted result, or copy an instant answer' },
      { keys: [['Alt', 'Enter'], ['Cmd', 'Enter']], label: 'Open the result in a new tab' },
      { keys: [['Ctrl', 'Enter']], label: 'Force the search engine, skipping macros' },
      { keys: [['ArrowUp'], ['ArrowDown'], ['Shift', 'Tab']], label: 'Move through suggestions' },
      { keys: [['Tab']], label: 'Highlight the first suggestion, or put the highlighted one in the field' },
      { keys: [['Shift', 'Delete']], label: 'Remove the highlighted history entry' },
      { keys: [['Esc']], label: 'Clear the query' },
      { keys: [['Space', 'Space']], label: 'Ask the AI' }
    ]
  },
  {
    title: 'Sites menu',
    rows: [
      { keys: [['Shift'], ['Right-click'], ['Scroll up']], label: 'Open the menu' },
      { keys: [['type anywhere']], label: 'Filter the cards by name' },
      { keys: [['<letter>']], label: "Open the card showing that letter" },
      { keys: [['Esc'], ['Shift']], label: 'Close the menu' }
    ]
  },
  {
    title: 'Anywhere',
    rows: [
      { keys: [['?']], label: 'Show this sheet (with an empty search field)' },
      { keys: [['Esc']], label: 'Close any panel' }
    ]
  }
]

export const KEY_LABELS = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→'
}
