import {type TextStyle} from 'react-native'

import {type NameGradientSpec} from './nameGradients'
import {gradientSamples, outlineColorFor} from './oklch'

/** Samples per gradient. More than this is invisible at name sizes. */
const SAMPLE_COUNT = 9

/**
 * Paints a decorated display name with a real gradient via
 * `background-clip: text`: the text is transparent and reveals the gradient
 * behind it. Placed last in a style array so `color: transparent` overrides
 * the theme text color.
 *
 * Browsers interpolate hex stops in sRGB, so a two-stop gradient would take a
 * different path than the same gradient on native. Sampling in OKLCH first and
 * handing the browser nine stops keeps the visible ramp the same on both.
 *
 * `outline` draws an edge around the letters: dark, or white when the fill is
 * dark enough to swallow a dark edge. The outline doubles as a contrast
 * guarantee: a gradient name reads on any background once it has a hard edge.
 */
export function nameGradientTextStyle(
  gradient: NameGradientSpec,
  opts?: {outline?: boolean},
): TextStyle {
  const edge = opts?.outline ? outlineColorFor(gradient.colors) : undefined

  if (gradient.colors.length < 2) {
    const flat: TextStyle & {filter?: string} = {color: gradient.solid}
    if (edge) flat.filter = edgeShadow(edge)
    return flat
  }

  const stops = gradient.segmented
    ? gradient.colors
        .map((color, index) => {
          const start = (index / gradient.colors.length) * 100
          const end = ((index + 1) / gradient.colors.length) * 100
          return `${color} ${start}% ${end}%`
        })
        .join(', ')
    : gradientSamples(gradient.colors, SAMPLE_COUNT).join(', ')

  const base: Record<string, unknown> = {
    backgroundImage: `linear-gradient(90deg, ${stops})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  }

  if (edge) {
    return {...base, filter: edgeShadow(edge)}
  }

  return {
    ...base,
    // Not in RN's TextStyle, but react-native-web forwards it to the DOM.
    textShadow: '0 0 1px rgba(0,0,0,0.06)',
  } as TextStyle
}

/** Four axis-aligned drop shadows, the cheapest hard text edge on the web. */
function edgeShadow(color: string) {
  const width = 2
  return [
    `drop-shadow(${width}px 0 0 ${color})`,
    `drop-shadow(-${width}px 0 0 ${color})`,
    `drop-shadow(0 ${width}px 0 ${color})`,
    `drop-shadow(0 -${width}px 0 ${color})`,
  ].join(' ')
}
