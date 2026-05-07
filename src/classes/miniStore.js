export default class MiniStore {
  #subscriptions = new Set()
  #state

  constructor(initialState) {
    this.#state = initialState
  }

  getState = () => {
    return this.#state
  }

  update = (newState) => {
    this.#state = newState

    this.#subscriptions.forEach(cb => cb())
  }

  subscribe = cb => {
    this.#subscriptions.add(cb)

    return () => {
      this.#subscriptions.delete(cb)
    }
  }
}