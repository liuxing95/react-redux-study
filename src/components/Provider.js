import React, { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ReactReduxContext } from './Context'
import Subscription from '../utils/Subscription';

function Provider({ store, context, children}) {
  // 缓存上下文内容 
  // store 不发生变化
  // contextValue 对象 缓存 store, subscription
  const contextValue = useMemo(() => {
    const subscription = new Subscription(store)
    // 挂载 subscription 的 onStateChange
    subscription.onStateChange = subscription.notifyNestedSubs
    return {
      store,
      subscription
    }
  }, [store])

  const previousState = useMemo(() => store.getState(), [store])

  useEffect(() => {
    const { subscription } = contextValue
    subscription.trySubscribe()

    // 如果 store里面的state 发生了变化
    if (previousState !== store.getState()) {
      // 通知挂载触发
      subscription.notifyNestedSubs()
    }

    // effect destory 清除之前的挂载 防止内存泄漏
    return () => {
      subscription.tryUnsubscribe()
      subscription.onStateChange = null
    }
  }, [contextValue, previousState])

  const Context = context || ReactReduxContext

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

if (process.env.NODE_ENV !== 'production') {
  Provider.propTypes = {
    store: PropTypes.shape({
      subscribe: PropTypes.func.isRequired,
      dispatch: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }),
    context: PropTypes.object,
    children: PropTypes.any,
  }
}

export default Provider
