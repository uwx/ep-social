import {render} from '@testing-library/react-native'

import {FictionkinBadge, FictionkinBadgeForProfile} from './FictionkinBadge'
import {BADGE_GLYPHS} from './fictionkinGlyphs'

jest.mock('#/components/Button', () => ({Button: () => null}))
jest.mock('#/components/Dialog', () => ({useDialogControl: () => ({})}))
jest.mock('#/components/FictionkinBadgeAlert', () => ({
  FictionkinBadgeAlert: () => null,
}))
jest.mock('@lingui/react/macro', () => ({
  useLingui: () => ({t: (s: TemplateStringsArray) => s.join('')}),
}))

it('draws every path of the character glyph', () => {
  const {getByTestId} = render(
    <FictionkinBadge character="ralsei" width={16} />,
  )

  const svg = getByTestId('fictionkinBadge')
  // Ralsei is the multi-color one: his paths must not be flattened to one fill.
  expect(svg.findAllByType('Path' as never)).toHaveLength(
    BADGE_GLYPHS.ralsei.paths.length,
  )
  expect(svg).toHaveProp('viewBox', BADGE_GLYPHS.ralsei.viewBox)
})

it('renders the labeled character for a profile', () => {
  const did = 'did:plc:subject'
  const {getByTestId} = render(
    <FictionkinBadgeForProfile
      profile={{
        did,
        labels: [
          {
            val: 'dr-noelle-fictionkin',
            src: did,
            uri: 'at://x',
            cts: '2026-01-01T00:00:00.000Z',
          },
        ],
      }}
      width={13}
    />,
  )

  expect(getByTestId('fictionkinBadge')).toHaveProp(
    'viewBox',
    BADGE_GLYPHS.noelle.viewBox,
  )
})

it('renders nothing for a profile without a label', () => {
  const {queryByTestId} = render(
    <FictionkinBadgeForProfile profile={{did: 'did:plc:subject'}} width={13} />,
  )

  expect(queryByTestId('fictionkinBadge')).toBeNull()
})
