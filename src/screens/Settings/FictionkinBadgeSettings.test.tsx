import {createElement} from 'react'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {FictionkinBadgeSettingsScreen} from './FictionkinBadgeSettings'

const i18n = setupI18n({locale: 'en', messages: {en: {}}})
type UpdateFn = (record: {labels?: unknown}) => {
  labels?: {$type: string; values: {val: string}[]}
}
const mockMutate = jest.fn<
  void,
  [{updates: UpdateFn} & Record<string, unknown>]
>()
const mockProfile = {
  did: 'did:plc:test',
  handle: 'test.bsky.social',
  displayName: 'Test Person',
  labels: [] as {val: string; src: string; uri: string; cts: string}[],
}

jest.mock('@lingui/react/macro', () => {
  const actual = jest.requireActual('@lingui/react/macro')
  return {
    ...actual,
    Trans: ({children}: {children: React.ReactNode}) => children,
    useLingui: () => ({
      i18n: {_: (d: {message?: string}) => d.message ?? ''},
      t: (strings: TemplateStringsArray) => strings.join(''),
    }),
  }
})
jest.mock('#/state/session', () => ({
  useSession: () => ({currentAccount: {did: 'did:plc:test'}}),
}))
jest.mock('#/state/queries/profile', () => ({
  useProfileQuery: () => ({data: mockProfile}),
  useProfileUpdateMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))
jest.mock('#/state/preferences/hide-own-fictionkin-badge', () => ({
  useHideOwnFictionkinBadge: () => false,
  useSetHideOwnFictionkinBadge: () => jest.fn(),
}))
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({invalidateQueries: jest.fn()}),
  }
})
jest.mock('#/components/Layout', () => {
  const react: typeof import('react') = jest.requireActual('react')
  const rn: typeof import('react-native') = jest.requireActual('react-native')
  const Pass = ({children}: {children?: React.ReactNode}) =>
    react.createElement(rn.View, null, children)
  return {
    Screen: Pass,
    Content: Pass,
    Header: {
      Outer: Pass,
      BackButton: () => null,
      Content: Pass,
      TitleText: Pass,
      Slot: () => null,
    },
  }
})
jest.mock('#/platform/ui-text-view', () => {
  const rn: typeof import('react-native') = jest.requireActual('react-native')
  return {UITextView: rn.Text}
})
jest.mock('#/components/Typography', () => {
  const rn: typeof import('react-native') = jest.requireActual('react-native')
  return {Text: rn.Text}
})
jest.mock('#/components/FictionkinBadge', () => {
  const react: typeof import('react') = jest.requireActual('react')
  const rn: typeof import('react-native') = jest.requireActual('react-native')
  return {
    FictionkinBadge: ({character}: {character: string}) =>
      react.createElement(rn.View, {testID: `badge-${character}`}),
  }
})
jest.mock('#/components/Button', () => {
  const react: typeof import('react') = jest.requireActual('react')
  const rn: typeof import('react-native') = jest.requireActual('react-native')
  return {
    Button: ({
      testID,
      label,
      onPress,
      disabled,
      children,
    }: {
      testID?: string
      label: string
      onPress?: () => void
      disabled?: boolean
      children?: React.ReactNode
    }) =>
      react.createElement(
        rn.Pressable,
        {testID, accessibilityLabel: label, disabled, onPress},
        children,
      ),
    ButtonText: ({children}: {children?: React.ReactNode}) =>
      react.createElement(rn.Pressable, null, children),
  }
})
jest.mock('#/components/Admonition', () => {
  const react: typeof import('react') = jest.requireActual('react')
  const rn: typeof import('react-native') = jest.requireActual('react-native')
  return {
    Admonition: ({children}: {children?: React.ReactNode}) =>
      react.createElement(rn.View, null, children),
  }
})
jest.mock('#/components/forms/Toggle', () => {
  const react: typeof import('react') = jest.requireActual('react')
  const rn: typeof import('react-native') = jest.requireActual('react-native')

  /*
   * Mirrors the real compound API closely enough to drive it: a radio item
   * reports its `name` up to the enclosing Group's onChange.
   */
  const RadioGroup = react.createContext<{
    onChange?: (values: string[]) => void
  }>({})
  // The item owns the value name; the radio inside it reports that name.
  const ItemName = react.createContext<string | undefined>(undefined)

  const Pass = ({children}: {children?: React.ReactNode}) =>
    react.createElement(rn.View, null, children)

  return {
    Item: ({
      children,
      onChange,
      value,
      testID,
      name,
    }: {
      children?: React.ReactNode
      onChange?: (v: boolean) => void
      value?: boolean
      testID?: string
      name?: string
    }) => {
      // Radio items carry no `value`; switches do.
      if (typeof value !== 'boolean') {
        return react.createElement(ItemName.Provider, {value: name}, children)
      }
      return react.createElement(
        rn.Pressable,
        {
          testID,
          accessibilityLabel: value ? 'on' : 'off',
          onPress: () => onChange?.(!value),
        },
        children,
      )
    },
    Group: ({
      children,
      onChange,
    }: {
      children?: React.ReactNode
      onChange?: (values: string[]) => void
    }) =>
      react.createElement(RadioGroup.Provider, {value: {onChange}}, children),
    LabelText: Pass,
    Platform: () => null,
    RadioWithLabel: ({label, selected}: {label: string; selected: boolean}) => {
      const group = react.useContext(RadioGroup)
      const name = react.useContext(ItemName)
      return react.createElement(
        rn.Pressable,
        {
          accessibilityLabel: label,
          accessibilityState: {selected},
          onPress: () => group.onChange?.([name ?? label]),
        },
        react.createElement(rn.Text, null, label),
      )
    },
  }
})

function renderScreen() {
  return render(
    createElement(
      I18nProvider,
      {i18n},
      createElement(FictionkinBadgeSettingsScreen, {
        navigation: {} as never,
        route: {} as never,
      }),
    ),
  )
}

beforeEach(() => {
  mockMutate.mockReset()
  mockProfile.labels = []
})

it('saves the chosen character and kin as a self-label', () => {
  const {getByTestId, getByLabelText} = renderScreen()

  fireEvent.press(getByLabelText('off'))
  fireEvent.press(getByLabelText('Susie'))
  fireEvent.press(getByLabelText('Fictive'))
  fireEvent.press(getByTestId('saveFictionkinBadge'))

  expect(mockMutate).toHaveBeenCalledTimes(1)
  const {updates} = mockMutate.mock.calls[0][0]
  expect(updates({labels: {values: [{val: 'pet'}]}})).toEqual({
    labels: {
      $type: 'com.atproto.label.defs#selfLabels',
      values: [{val: 'pet'}, {val: 'dr-susie-fictive'}],
    },
  })
})

it('shows the saved badge as already on', () => {
  mockProfile.labels = [
    {
      val: 'dr-noelle-otherkin',
      src: 'did:plc:test',
      uri: 'at://x',
      cts: '2026-01-01T00:00:00.000Z',
    },
  ]
  const {getByLabelText} = renderScreen()

  // The toggle reflects the stored label rather than defaulting to off.
  expect(getByLabelText('on')).toBeTruthy()
  expect(getByLabelText('Noelle').props.accessibilityState).toEqual({
    selected: true,
  })
  expect(getByLabelText('Otherkin').props.accessibilityState).toEqual({
    selected: true,
  })
})

it('removes the badge when the toggle is turned off and saved', () => {
  mockProfile.labels = [
    {
      val: 'dr-kris-s',
      src: 'did:plc:test',
      uri: 'at://x',
      cts: '2026-01-01T00:00:00.000Z',
    },
  ]
  const {getByTestId, getByLabelText} = renderScreen()

  fireEvent.press(getByLabelText('on'))
  fireEvent.press(getByTestId('saveFictionkinBadge'))

  const {updates} = mockMutate.mock.calls[0][0]
  expect(
    updates({labels: {values: [{val: 'pet'}, {val: 'dr-kris-s'}]}}),
  ).toEqual({
    labels: {
      $type: 'com.atproto.label.defs#selfLabels',
      values: [{val: 'pet'}],
    },
  })
})
