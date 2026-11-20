import {hasGoogleFont} from './googleFonts'
import {getNameGradient, type NameGradientSpec} from './nameGradients'
import {sampleGradient} from './oklch'
import {type DecorationSettings} from './records'

/**
 * How a display name is painted, resolved once for every surface that renders
 * names (feeds, profiles, DMs, notifications, navigation).
 *
 * The record can hold one of three paints; precedence is custom gradient,
 * custom solid, then a curated gradient id. Font choice is independent of the
 * paint, so a name can use a custom face without touching its color.
 */
export type NamePaint = {
  /** Gradient stops, when the name has a gradient paint. */
  gradient?: NameGradientSpec
  /** Flat fill otherwise; also the fallback for gradient paints. */
  color?: string
  /** Draw an edge around the letters so the name reads on any background. */
  outline: boolean
  /** Google Fonts family, when the record names one this build ships. */
  font?: string
}

/** Mid-gradient color, used as the flat fill behind a gradient. */
export function gradientSolid(colors: string[]): string {
  return sampleGradient(colors, 0.5)
}

/**
 * @param settings the author's record, if it has loaded
 * @param options.forceOutline the viewer asked for edges on decorated names
 * @param options.customDisabled the viewer asked to ignore custom paints/faces
 */
export function resolveNamePaint(
  settings: DecorationSettings | undefined,
  {
    forceOutline = false,
    customDisabled = false,
  }: {forceOutline?: boolean; customDisabled?: boolean} = {},
): NamePaint | undefined {
  if (!settings) return undefined

  let gradient: NameGradientSpec | undefined
  let color: string | undefined

  if (!customDisabled && settings.nameGradient) {
    const {colors, hard} = settings.nameGradient
    gradient = {
      colors,
      ...(hard ? {segmented: true} : {}),
      solid: gradientSolid(colors),
    }
  } else if (!customDisabled && settings.nameColor) {
    color = settings.nameColor
  } else {
    const curated = getNameGradient(settings.name)
    if (curated) {
      gradient = {
        colors: curated.colors,
        ...(curated.segmented ? {segmented: true} : {}),
        solid: curated.solid,
      }
    }
  }

  const font = customDisabled ? undefined : settings.nameFont
  const validFont = hasGoogleFont(font) ? font : undefined

  if (!gradient && !color && !validFont) return undefined

  return {
    ...(gradient ? {gradient} : {}),
    ...(color ? {color} : {}),
    // A lone font has no fill to edge, so it only inherits the viewer's pref
    // when the author already asked for an outline.
    outline: !!(gradient || color) && (!!settings.nameOutline || forceOutline),
    ...(validFont ? {font: validFont} : {}),
  }
}
