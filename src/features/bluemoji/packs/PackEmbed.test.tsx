import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render, screen} from '@testing-library/react-native'

import {PackEmbed} from '#/features/bluemoji/packs/PackEmbed'

jest.mock('#/components/Link', () => {
  const {View} = jest.requireActual('react-native')
  return {
    Link: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
  }
})
jest.mock('#/state/preferences/enable-square-buttons', () => ({
  useEnableSquareButtons: () => undefined,
}))
jest.mock('#/state/queries/resolve-uri', () => ({
  useResolveDidQuery: () => ({data: 'did:plc:alice'}),
}))
jest.mock('#/state/queries/profile', () => ({
  useProfileQuery: () => ({data: {handle: 'alice.test'}}),
}))
jest.mock('#/features/bluemoji/packs/queries', () => ({
  usePackQuery: () => ({
    data: {
      uri: 'at://did:plc:alice/blue.moji.packs.pack/3kpack',
      cid: 'bafypack',
      did: 'did:plc:alice',
      pdsUrl: 'https://pds.example',
      record: {
        name: 'cats',
        description: 'a pile of cats',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    },
  }),
}))
jest.mock('#/alf', () => {
  const atoms =
    jest.requireActual<typeof import('@bsky.app/alf')>('@bsky.app/alf').atoms
  return {
    atoms,
    useTheme: () => ({atoms: {}, palette: {primary_500: '#000'}}),
    useAlf: () => ({
      fonts: {family: 'system', scaleMultiplier: 1, letterSpacing: 0},
      flags: {},
    }),
    flatten: (style: unknown) =>
      Object.assign({}, ...[style].flat(Infinity).filter(Boolean)),
    applyFonts: () => {},
    web: () => undefined,
    native: () => undefined,
    io: () => undefined,
    android: () => undefined,
    ios: () => undefined,
    platform: (value: unknown) => value,
    useBreakpoints: () => ({gtMobile: false}),
  }
})
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('#/components/Typography', () => {
  const {Text} = jest.requireActual('react-native')
  return {Text}
})

it('renders the pack record from the PDS, not the link preview', () => {
  render(
    <I18nProvider i18n={i18n}>
      <PackEmbed
        view={{
          $type: 'app.bsky.embed.external#viewExternal',
          uri: 'https://witchsky.app/profile/alice.test/emoji-pack/3kpack',
          title: 'stale og title',
          description: 'stale og description',
        }}
      />
    </I18nProvider>,
  )

  expect(screen.getByText('cats')).toBeTruthy()
  expect(screen.getByText('a pile of cats')).toBeTruthy()
  // sanitizeHandle wraps the handle in bidi isolates.
  expect(screen.getByText(/Emoji pack by .*@alice\.test/)).toBeTruthy()
  expect(screen.queryByText('stale og title')).toBeNull()
})
