import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['disableCustomNameStyles']
type SetContext = (v: persisted.Schema['disableCustomNameStyles']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.disableCustomNameStyles,
)
const setContext = createContext<SetContext>(
  (_: persisted.Schema['disableCustomNameStyles']) => {},
)

/**
 * Viewer preference: ignore other accounts' custom display-name colors and
 * fonts (`nameColor`, `nameGradient`, `nameFont`). Curated gradient ids and
 * avatar frames still render; this only drops record-provided paints and
 * faces, which are the ones a viewer cannot preview or vet.
 */
export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('disableCustomNameStyles'))

  const setStateWrapped = useCallback(
    (value: persisted.Schema['disableCustomNameStyles']) => {
      setState(value)
      void persisted.write('disableCustomNameStyles', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('disableCustomNameStyles', next => {
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

export function useDisableCustomNameStyles() {
  return useContext(stateContext)
}

export function useSetDisableCustomNameStyles() {
  return useContext(setContext)
}
