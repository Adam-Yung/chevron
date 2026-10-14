import LocalStorageObject from './localStorageObject'
import MiniSearch from 'minisearch'

export default class History extends LocalStorageObject {
  static objectName = 'history'
  static get initialState() {
    return []
  } 
  // limit of entries
  static limit = 5000
  static add(query) {
    const history = LocalStorageObject.read(History.objectName)

    // if the quary is alredy in the list
    if (history.find(entry => entry.id === query.id))
      return

    // remove the last element if the limit exceeded
    if (history.length >= History.limit)
      history.pop()

    history.unshift(query)

    LocalStorageObject.write(History.objectName, history)
  }

  #miniSearch
  // Lazy index: the (potentially large, up to History.limit entries)
  // MiniSearch index is NOT built in the constructor. Building it eagerly
  // ran a synchronous addAll over every stored entry on the critical path
  // (module-eval of useSuggestions), delaying first-input readiness even
  // though suggestions aren't needed until the user types. We build it on
  // the first suggest() call instead.
  #indexed = false

  constructor() {
    super(History.objectName, History.initialState)
  }

  #ensureIndex() {
    if (this.#indexed) return
    this.#miniSearch = new MiniSearch({ fields: ['id'] })
    this.#miniSearch.addAll(this.object)
    this.#indexed = true
  }

  suggest(query) {
    this.#ensureIndex()
    const result = this.#miniSearch.search(query, {
      prefix: term => term.length > 3, 
      fizzy: 0.2,
      combineWith: 'AND'
    })
    for(const suggestion of result) {
      suggestion.relevance = suggestion.score * 1000
      suggestion.suggestion = suggestion.id
    }

    return result
  }

  sync() {
    super.sync()
    this.#syncMiniSearch()
  }

  #syncMiniSearch() {
    // If the index was never built (user never typed), there's nothing to
    // resync — it will be built lazily on the next suggest().
    if (!this.#indexed) return
    this.#miniSearch.removeAll()
    this.#miniSearch.addAll(this.object)
  }
}