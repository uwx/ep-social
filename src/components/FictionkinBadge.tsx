import {View} from 'react-native'
import Svg, {Path} from 'react-native-svg'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {FictionkinBadgeAlert} from '#/components/FictionkinBadgeAlert'
import {BADGE_GLYPHS} from '#/components/fictionkinGlyphs'
import {getDeltaLabel, type KinCharacter} from '#/components/fictionkinLabels'
import type * as bsky from '#/types/bsky'

export {
  type DeltaLabel,
  deltaLabelValue,
  getDeltaLabel,
  isDeltaLabelValue,
  isFictionkinAccount,
  KIN_CHARACTER_NAMES,
  KIN_CHARACTERS,
  KIN_TYPES,
  type KinCharacter,
  type KinType,
  parseDeltaLabel,
} from '#/components/fictionkinLabels'

/**
 * The character glyph. The source art is pixel-sized with per-character aspect
 * ratios, so it scales to a square box with `meet` to stay undistorted.
 */
export function FictionkinBadge({
  character,
  width,
}: {
  character: KinCharacter
  width: number
}) {
  const glyph = BADGE_GLYPHS[character]
  if (!glyph) return null
  return (
    <Svg
      testID="fictionkinBadge"
      width={width}
      height={width}
      viewBox={glyph.viewBox}
      preserveAspectRatio="xMidYMid meet">
      {glyph.paths.map(path => (
        <Path key={path.d} d={path.d} fill={path.fill} />
      ))}
    </Svg>
  )
}

/** Standalone badge for a profile view, or null when it has no label. */
export function FictionkinBadgeForProfile({
  profile,
  width,
}: {
  profile: {
    did: string
    labels?: ComAtprotoLabelDefs.Label[]
  }
  width: number
}) {
  const label = getDeltaLabel(profile)
  if (!label) return null
  return <FictionkinBadge character={label.character} width={width} />
}

/** The tappable header badge: scales on hover and explains itself on tap. */
export function FictionkinBadgeButton({
  profile,
  width,
  hitSlop = 20,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
  hitSlop?: React.ComponentProps<typeof Button>['hitSlop']
}) {
  const {t: l} = useLingui()
  const control = useDialogControl()
  const label = getDeltaLabel(profile)

  if (!label) return null

  return (
    <>
      <Button
        label={l`Fictionkin badge`}
        hitSlop={hitSlop}
        onPress={event => {
          event.preventDefault()
          control.open()
        }}>
        {({hovered}) => (
          <View
            style={[
              a.transition_transform,
              {
                width,
                height: width,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            <FictionkinBadge character={label.character} width={width} />
          </View>
        )}
      </Button>
      <FictionkinBadgeAlert control={control} profile={profile} label={label} />
    </>
  )
}
