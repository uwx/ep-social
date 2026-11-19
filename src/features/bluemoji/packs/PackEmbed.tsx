import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {SHARP_CORNERS} from '#/lib/shapes'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {atoms as a, useTheme} from '#/alf'
import {EmojiHeartEyes_Stroke2_Corner0_Rounded as BluemojiIcon} from '#/components/icons/Emoji'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {usePackQuery} from './queries'
import {getPackEmbedRoute, getPackIconUrl, packPath} from './util'

/**
 * A pack link rendered as a card. The pack record is read from its owner's PDS,
 * so the icon, name and description are authoritative even when the OG preview
 * that non-Witchsky clients see is stale or missing.
 */
export function PackEmbed({
  view,
  onOpen,
  style,
}: {
  view: app.bsky.embed.external.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const sharp = useEnableSquareButtons() === 'sharp' && SHARP_CORNERS
  const route = getPackEmbedRoute(view)
  const {data: did} = useResolveDidQuery(route?.name)
  const {data: pack} = usePackQuery({
    did,
    rkey: route?.rkey ?? '',
    enabled: Boolean(route),
  })
  const creator = useProfileQuery({did: pack?.did})

  if (!route) return null

  const iconUri = pack ? getPackIconUrl(pack) : view.thumb
  const title = pack?.record.name ?? view.title
  const description = pack?.record.description ?? view.description
  const handle = creator.data?.handle
  const author = handle
    ? l`Emoji pack by ${sanitizeHandle(handle, '@')}`
    : l`Emoji pack`

  return (
    <View
      style={[
        a.mt_sm,
        a.flex_col,
        a.align_stretch,
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        a.w_full,
        t.atoms.border_contrast_low,
        sharp,
        style,
      ]}>
      <Link
        label={l`Open ${title}`}
        to={packPath(route.name, route.rkey)}
        onPress={onOpen}
        style={[a.w_full, a.flex_col, a.align_stretch]}>
        <View style={[a.flex_row, a.align_center, a.gap_md, a.p_md]}>
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
              numberOfLines={2}
              style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {author}
            </Text>
          </View>
        </View>
        {description ? (
          <Text
            emoji
            numberOfLines={2}
            style={[
              a.px_md,
              a.pb_md,
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            {description}
          </Text>
        ) : null}
      </Link>
    </View>
  )
}
