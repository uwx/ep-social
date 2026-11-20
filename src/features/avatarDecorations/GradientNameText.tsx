import createEmojiRegex from 'emoji-regex'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

import {UITextView} from '#/platform/ui-text-view'
import {IS_WEB} from '#/env'
import {type NameGradientSpec} from './nameGradients'
import {sampleGradient} from './oklch'

const EMOJI = createEmojiRegex()

/**
 * Colors a display name across its letters on native, where text cannot take a
 * paint gradient. Web returns the plain string because `nameGradientTextStyle`
 * already paints the whole run with `background-clip: text`.
 *
 * Coloring individual graphemes does not change the font metrics, so wrapping
 * and truncation of the surrounding `Text` behave exactly as before. Emoji keep
 * their own colors. Stops blend in OKLCH, matching the web gradient.
 */
export function GradientNameText({
  gradient,
  children,
}: {
  gradient: NameGradientSpec
  children: string
}) {
  if (IS_WEB) return children

  const segments = [...splitGraphemes(children)]
  return segments.map((segment, index) => {
    if (EMOJI.test(segment)) {
      return (
        <UITextView key={index} style={{fontFamily: 'System'}}>
          {segment}
        </UITextView>
      )
    }
    const color = gradient.segmented
      ? gradient.colors[
          Math.floor((index / segments.length) * gradient.colors.length)
        ]
      : sampleGradient(gradient.colors, index / Math.max(segments.length - 1, 1))
    return (
      <UITextView key={index} style={{color}}>
        {segment}
      </UITextView>
    )
  })
}
