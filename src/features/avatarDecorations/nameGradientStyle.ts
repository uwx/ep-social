import {type TextStyle} from 'react-native'

import {type NameGradient} from './nameGradients'

/**
 * Native style for a decorated display name. Native text cannot take a paint
 * gradient cheaply, so `GradientName` colors each grapheme and this only
 * supplies the fallback color plus the outline shadow.
 *
 * `outline` adds a dark edge around the letters. Native cannot stroke text, so
 * a tight dark shadow approximates it; Android draws real offset copies in
 * `OutlinedName`.
 */
export function nameGradientTextStyle(
  gradient: Pick<NameGradient, 'colors' | 'segmented'> & {solid?: string},
  opts?: {outline?: boolean},
): TextStyle {
  if (opts?.outline) {
    return {
      color: gradient.solid,
      textShadowColor: '#050408',
      textShadowOffset: {width: 0, height: 0},
      textShadowRadius: 2,
    }
  }
  return {color: gradient.solid}
}
