import {type TextStyle} from 'react-native'

import {type NameGradientSpec} from './nameGradients'
import {outlineColorFor} from './oklch'

/**
 * Native style for a decorated display name. Native text cannot take a paint
 * gradient cheaply, so `GradientNameText` colors each grapheme and this only
 * supplies the fallback color plus the outline shadow.
 *
 * `outline` adds an edge around the letters that the fill cannot swallow: the
 * shadow is dark by default and white for a dark fill. Native cannot stroke
 * text, so a tight shadow approximates it.
 */
export function nameGradientTextStyle(
  gradient: NameGradientSpec,
  opts?: {outline?: boolean},
): TextStyle {
  if (opts?.outline) {
    return {
      color: gradient.solid,
      textShadowColor: outlineColorFor(gradient.solid ?? gradient.colors),
      textShadowOffset: {width: 0, height: 0},
      textShadowRadius: 2,
    }
  }
  return {color: gradient.solid}
}
