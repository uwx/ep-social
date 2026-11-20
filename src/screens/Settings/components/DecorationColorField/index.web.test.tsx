/** @jest-environment jsdom */

import {act} from 'react'
import {createRoot} from 'react-dom/client'

import {DecorationColorField} from './index.web'

jest.mock('react-native', () => jest.requireActual('react-native-web'))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: {border_contrast_low: {borderColor: '#cccccc'}}}),
}))
/* The real field pulls in icons, env and the font stack; only the hex box is under test. */
jest.mock('#/components/forms/TextField', () => {
  const {TextInput, View} =
    jest.requireActual<typeof import('react-native')>('react-native-web')
  return {
    Root: ({children}: React.PropsWithChildren) => <View>{children}</View>,
    Input: (props: {onChangeText: (text: string) => void}) => (
      <TextInput {...props} />
    ),
  }
})

function render(node: React.ReactNode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    createRoot(container).render(node)
  })
  return container
}

function colorInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type=color]')
  if (!input) throw new Error('no color input rendered')
  return input
}

it('opens the browser picker over the swatch at the stored color', () => {
  const container = render(
    <DecorationColorField
      label="Name color"
      value="#112233"
      onChange={() => {}}
      testID="field"
    />,
  )

  const input = colorInput(container)
  expect(input.value).toBe('#112233')
  expect(input.getAttribute('data-testid')).toBe('field-swatch')
  expect(input.getAttribute('aria-label')).toBe('Name color')
})

it('stores what the browser picker returns, normalized', () => {
  const onChange = jest.fn()
  const container = render(
    <DecorationColorField
      label="Name color"
      value="#112233"
      onChange={onChange}
      testID="field"
    />,
  )

  const input = colorInput(container)
  /*
   * React tracks the last value it rendered and drops an `input` event when the
   * property already matches it, so drive the native setter like a real picker.
   */
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  act(() => {
    setValue?.call(input, '#aabbcc')
    input.dispatchEvent(new Event('input', {bubbles: true}))
  })

  expect(onChange).toHaveBeenCalledWith('#aabbcc')
})
