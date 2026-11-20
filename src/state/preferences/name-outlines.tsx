import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['showNameOutlines']
type SetContext = (v: persisted.Schema['showNameOutlines']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.showNameOutlines,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['showNameOutlines']) => {},
)

/**
 * Viewer preference: draw an edge around decorated display names even when the
 * author did not ask for one. Plain names are untouched, since their color
 * already follows the theme.
 */
export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('showNameOutlines'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['showNameOutlines']) => {
      setState(value)
      void persisted.write('showNameOutlines', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('showNameOutlines', next => {
      setState(next)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useShowNameOutlines() {
  return useContext(stateContext)
}

export function useSetShowNameOutlines() {
  return useContext(setContext)
}
