import {type ReactNode, useState} from 'react'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {DecorationColorField} from './DecorationColorField'

jest.mock('#/components/forms/Slider', () => ({Slider: () => null}))
jest.mock('#/components/Typography', () => {
  const rn: typeof import('react-native') = jest.requireActual('react-native')
  return {Text: rn.Text}
})

const i18n = setupI18n({locale: 'en', messages: {en: {}}})

function withI18n(node: ReactNode) {
  return <I18nProvider i18n={i18n}>{node}</I18nProvider>
}

/** Field wired the way the screen uses it: edits round-trip through state. */
function Field({initial = '#112233'}: {initial?: string}) {
  const [value, setValue] = useState(initial)
  return (
    <DecorationColorField
      label="Name color"
      value={value}
      onChange={setValue}
      testID="field"
    />
  )
}

it('keeps shorthand hex in the box while storing the expanded color', () => {
  const {getByTestId} = render(withI18n(<Field />))

  fireEvent.changeText(getByTestId('field-hex'), '#123')

  // The field emitted #112233; rewriting the box would fight the typer.
  expect(getByTestId('field-hex')).toHaveProp('value', '#123')
})

it('adopts a color set outside the box', () => {
  const field = (value: string) => (
    <I18nProvider i18n={i18n}>
      <DecorationColorField
        label="Name color"
        value={value}
        onChange={() => {}}
        testID="field"
      />
    </I18nProvider>
  )
  const {getByTestId, rerender} = render(field('#112233'))

  rerender(field('#445566'))

  expect(getByTestId('field-hex')).toHaveProp('value', '#445566')
})

it('ignores text that is not a color yet', () => {
  const onChange = jest.fn()
  const {getByTestId} = render(
    withI18n(
      <DecorationColorField
        label="Name color"
        value="#112233"
        onChange={onChange}
        testID="field"
      />,
    ),
  )

  fireEvent.changeText(getByTestId('field-hex'), '#12')

  expect(onChange).not.toHaveBeenCalled()
  expect(getByTestId('field-hex')).toHaveProp('value', '#12')
})
