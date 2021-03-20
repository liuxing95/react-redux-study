import { getBatch } from './batch'
const nullListeners = { notify() {} }

function createListenerCollection() {
  const batch = getBatch()

  let first = null
  let last = null

  return {
    clear() {
      first = null
      last = null
    },

    notify() {
      batch(() => {
        let listener = first
        while(listener) {
          listener.callback()
          listener = listener.next
        }
      })
    },

    get() {
      let listeners = []
      let listener = first
      while(listener) {
        listeners.push(listener)
        listener = listener.next
      }
      return listeners
    },

    subscribe(callback) {
      let isSubscribed = true

      // 双向链表
      let listener = (last = {
        callback,
        next: null,
        prev: last
      })

      if (listener.prev) {
        listener.prev.next = listener
      } else {
        first = listener
      }

      // 删除你挂载的 listener
      return function unsubscribe() {
        if (!isSubscribed || first === null) return
        isSubscribed = false

        if (listener.next) {
          listener.next.prev = listener.prev
        } else {
          last = listener.prev
        }

        if (listener.prev) {
          listener.prev.next = listener.next
        } else {
          first = listener.next
        }
      }
    }
  }
}

export default class Subscription {
  constructor(store, parentSub) {
    this.store = store
    this.parentSub = parentSub
    this.unsubscribe = null
    this.listeners = nullListeners

    this.handleChangeWrapper = this.handleChangeWrapper.bind(this)
  }

  // addNestedSub()

  notifyNestedSubs() {
    this.listeners.notify()
  }

  handleChangeWrapper() {
    if (this.onStateChange) {
      this.onStateChange()
    }
  }

  trySubscribe() {
    if(!this.unsubscribe) {
      this.unsubscribe = this.parentSub
        ? this.parentSub.addNestedSub(this.handleChangeWrapper)
        : this.store.subscribe(this.handleChangeWrapper)

      this.listeners = createListenerCollection()
    }
  }

  tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
      this.listeners.clear()
      this.listeners = nullListeners
    }
  }
}