import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {SHARP_CORNERS} from '#/lib/shapes'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {atoms as a, useTheme} from '#/alf'
import {EmojiHeartEyes_Stroke2_Corner0_Rounded as BluemojiIcon} from '#/components/icons/Emoji'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type BluemojiPack, getPackIconUrl, packPath, packRkey} from './util'

/**
 * A pack as a row. `name` is the profile identifier the link resolves through,
 * so it can be a handle or a DID.
 */
export function PackCard({
  pack,
  count,
  name,
}: {
  pack: BluemojiPack
  count: number
  name: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const sharp = useEnableSquareButtons() === 'sharp' && SHARP_CORNERS
  const iconUri = getPackIconUrl(pack)

  return (
    <Link
      label={l`Open ${pack.record.name}`}
      to={packPath(name, packRkey(pack.uri))}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.p_md,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
        sharp,
      ]}>
      <View
        style={[
          a.rounded_sm,
          a.overflow_hidden,
          a.align_center,
          a.justify_center,
          {width: 48, height: 48},
          t.atoms.bg_contrast_25,
        ]}>
        {iconUri ? (
          <Image
            source={{uri: iconUri}}
            contentFit="cover"
            style={{width: 48, height: 48}}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <BluemojiIcon size="lg" fill={t.palette.primary_500} />
        )}
      </View>
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text
          emoji
          numberOfLines={1}
          style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
          {pack.record.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {l`${String(count)} emoji`}
          {pack.record.description ? ` · ${pack.record.description}` : ''}
        </Text>
      </View>
    </Link>
  )
}
