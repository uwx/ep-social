import {createContext, useContext, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'

/**
 * Whether to hide your own fictionkin badge from your own view. Other people
 * still see it; this only affects how your own posts and profile look to you.
 */
const stateContext = createContext(false)
const setContext = createContext<(value: boolean) => void>(() => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState(
    persisted.get('hideOwnFictionkinBadge') ?? false,
  )

  function update(value: boolean) {
    setState(value)
    void persisted.write('hideOwnFictionkinBadge', value)
  }

  useEffect(() => {
    return persisted.onUpdate('hideOwnFictionkinBadge', value => {
      setState(value ?? false)
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={update}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useHideOwnFictionkinBadge() {
  return useContext(stateContext)
}

export function useSetHideOwnFictionkinBadge() {
  return useContext(setContext)
}
