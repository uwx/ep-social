import {msg} from '@lingui/core/macro'
import {render} from '@testing-library/react-native'

import {type DecorationFrame} from '#/features/avatarDecorations/catalog'
import {UserAvatar} from '#/view/com/util/UserAvatar'

const frame = (id: string, name: string, color: string): DecorationFrame => ({
  id,
  name: msg`${name}`,
  color,
})

jest.mock('#/state/preferences/enable-square-avatars', () => ({
  useEnableSquareAvatars: () => true,
}))
jest.mock('#/state/preferences/enable-square-buttons', () => ({
  useEnableSquareButtons: () => true,
}))
jest.mock('#/state/preferences/image-cdn-host', () => ({
  useImageCdnHost: () => undefined,
  applyImageTransforms: (uri: string) => uri,
}))
jest.mock('#/state/preferences/thumbnail-format', () => ({
  useThumbnailFormat: () => 'default',
}))
jest.mock('#/alf', () => ({
  atoms: {rounded_md: {borderRadius: 8}},
  useTheme: () => ({
    scheme: 'light',
    atoms: {
      border_contrast_low: {borderColor: '#ccc'},
      border_contrast_high: {borderColor: '#333'},
    },
    palette: {contrast_25: '#222', primary_500: '#f00'},
  }),
  platform: ({native}: {native: unknown}) => native,
}))
jest.mock('#/features/themes/accentForeground', () => ({
  accentForeground: () => '#fff',
}))
jest.mock('#/lib/haptics', () => ({}))
jest.mock('#/lib/hooks/usePermissions', () => ({}))
jest.mock('#/lib/media/manip', () => ({}))
jest.mock('#/lib/media/picker', () => ({}))
jest.mock('#/state/gallery', () => ({}))
jest.mock('#/state/queries/unstable-profile-cache', () => ({}))
jest.mock('#/view/com/composer/photos/EditImageDialog', () => ({}))
jest.mock('#/components/Button', () => ({}))
jest.mock('#/components/Dialog', () => ({}))
jest.mock('#/components/Dialog/sheet-wrapper', () => ({}))
jest.mock('#/components/Link', () => ({}))
jest.mock('#/components/Menu', () => ({}))
jest.mock('#/components/ProfileHoverCard', () => ({}))
jest.mock('#/analytics', () => ({}))
jest.mock('#/features/avatarDecorations', () => ({
  AvatarDecorationRing:
    require('#/features/avatarDecorations/AvatarDecorationRing')
      .AvatarDecorationRing,
  HexagonAvatar:
    require('#/features/avatarDecorations/HexagonAvatar').HexagonAvatar,
  useAvatarDecoration: () => undefined,
  useAvatarShape: () => undefined,
}))
jest.mock('#/features/liveNow', () => ({}))
jest.mock('#/features/liveNow/components/LiveIndicator', () => ({}))
jest.mock('#/features/liveNow/components/LiveStatusDialog', () => ({}))

const avatar = 'https://example.com/avatar.jpg'

it('draws a decoration ring instead of a plain border', () => {
  const {getByTestId, queryByTestId} = render(
    <UserAvatar
      type="user"
      size={40}
      avatar={avatar}
      usePlainRNImage
      decoration={frame('gold-ring', 'Gold', '#FFD700')}
    />,
  )

  expect(getByTestId('avatarDecorationRing')).toHaveStyle({
    borderColor: '#FFD700',
  })
  expect(queryByTestId('avatarHexagonBorder')).toBeNull()
})

it('clips a hexagon avatar and strokes it with the frame color', () => {
  const {getByTestId, queryByTestId} = render(
    <UserAvatar
      type="user"
      size={40}
      avatar={avatar}
      usePlainRNImage
      profileShape="hexagon"
      decoration={frame('flame-ring', 'Flame', '#F2571F')}
    />,
  )

  // The ring overlay cannot follow a hexagon, so the stroke moves onto the path.
  expect(queryByTestId('avatarDecorationRing')).toBeNull()
  expect(getByTestId('avatarHexagonBorder')).toBeTruthy()
  expect(getByTestId('avatarHexagonBorder')).toHaveProp('stroke', '#F2571F')
})

it('never decorates a blurred avatar', () => {
  const {queryByTestId} = render(
    <UserAvatar
      type="user"
      size={40}
      avatar={avatar}
      usePlainRNImage
      moderation={{blur: true} as never}
      decoration={frame('gold-ring', 'Gold', '#FFD700')}
      profileShape="hexagon"
    />,
  )

  expect(queryByTestId('avatarDecorationRing')).toBeNull()
  expect(queryByTestId('avatarHexagonBorder')).toBeNull()
})
