import createEmojiRegex from 'emoji-regex'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

import {UITextView} from '#/platform/ui-text-view'
import {IS_WEB} from '#/env'
import {type NameGradient} from './nameGradients'

const EMOJI = createEmojiRegex()

/** Interpolates between gradient stops at `fraction` (0 to 1). */
function colorAt(colors: string[], fraction: number): string {
  const position = Math.min(Math.max(fraction, 0), 1) * (colors.length - 1)
  const start = Math.floor(position)
  const end = Math.min(start + 1, colors.length - 1)
  const t = position - start
  const from = parseInt(colors[start].slice(1), 16)
  const to = parseInt(colors[end].slice(1), 16)
  const channel = (shift: number) =>
    Math.round(((from >> shift) & 255) * (1 - t) + ((to >> shift) & 255) * t)
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}

/**
 * Colors a display name across its letters on native, where text cannot take a
 * paint gradient. Web returns the plain string because `nameGradientTextStyle`
 * already paints the whole run with `background-clip: text`.
 *
 * Coloring individual graphemes does not change the font metrics, so wrapping
 * and truncation of the surrounding `Text` behave exactly as before. Emoji keep
 * their own colors.
 */
export function GradientNameText({
  gradient,
  children,
}: {
  gradient: Pick<NameGradient, 'colors' | 'segmented'> & {solid?: string}
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
      : colorAt(gradient.colors, index / Math.max(segments.length - 1, 1))
    return (
      <UITextView key={index} style={{color}}>
        {segment}
      </UITextView>
    )
  })
}
