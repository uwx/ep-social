/**
 * OKLCH color math for display-name paints.
 *
 * Self-contained sRGB <-> OKLab conversions (CSS Color 4 matrices) so the
 * native per-grapheme renderer and the web gradient agree exactly, and so a
 * name's colors need no color library on the feed path. Out-of-gamut colors are
 * mapped back by reducing chroma at constant lightness and hue, which keeps the
 * picker's L/C/H values meaningful instead of clipping channels.
 */

/** Lightness 0-1, chroma 0-~0.4, hue 0-360. */
export type Oklch = {
  l: number
  c: number
  h: number
}

export const DARK_OUTLINE = '#050408'
export const LIGHT_OUTLINE = '#ffffff'

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Parsed hexes are pure values, so this stays bounded by what we render. */
const oklchCache = new Map<string, Oklch>()

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** Normalizes `#abc`, `abc`, or `#aabbcc` to `#aabbcc`, or null. */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = HEX_RE.exec(value.trim())
  if (!match) return null
  const digits = match[1].toLowerCase()
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map(digit => digit + digit)
          .join('')
      : digits
  return `#${full}`
}

function toLinear(channel: number) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function fromLinear(channel: number) {
  const c =
    channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055
  return clamp(Math.round(c * 255), 0, 255)
}

function linearToOklab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ]
}

function oklabToLinear(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** OKLCH for a `#rrggbb` string, or null when it does not parse. */
export function hexToOklch(hex: string): Oklch | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const cached = oklchCache.get(normalized)
  if (cached) return cached
  const value = parseInt(normalized.slice(1), 16)
  const [L, a, b] = linearToOklab(
    toLinear((value >> 16) & 255),
    toLinear((value >> 8) & 255),
    toLinear(value & 255),
  )
  const color = {
    l: L,
    c: Math.sqrt(a * a + b * b),
    h: (Math.atan2(b, a) * 180) / Math.PI + (b < 0 ? 360 : 0),
  }
  if (oklchCache.size < 2048) oklchCache.set(normalized, color)
  return color
}

/**
 * `#rrggbb` for an OKLCH color. Chroma beyond sRGB is reduced (12 bisection
 * steps) instead of clipped per channel, so light/dark gradients keep their
 * even progression.
 */
export function oklchToHex(color: Oklch): string {
  const l = clamp(color.l, 0, 1)
  const h = color.h
  const c = Math.max(color.c, 0)
  const toLinearRgb = (chroma: number) => {
    const radians = (h * Math.PI) / 180
    return oklabToLinear(
      l,
      Math.cos(radians) * chroma,
      Math.sin(radians) * chroma,
    )
  }
  const inGamut = (linear: [number, number, number]) =>
    linear.every(channel => channel >= -0.0001 && channel <= 1.0001)

  let linear = toLinearRgb(c)
  if (!inGamut(linear) && c > 0) {
    let low = 0
    let high = c
    for (let step = 0; step < 12; step++) {
      const mid = (low + high) / 2
      if (inGamut(toLinearRgb(mid))) {
        low = mid
      } else {
        high = mid
      }
    }
    linear = toLinearRgb(low)
  }
  const [r, g, b] = linear.map(fromLinear) as [number, number, number]
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

/** WCAG relative luminance of a `#rrggbb` color, 0-1. */
function relativeLuminance(hex: string) {
  const value = parseInt(hex.slice(1), 16)
  return (
    0.2126 * toLinear((value >> 16) & 255) +
    0.7152 * toLinear((value >> 8) & 255) +
    0.0722 * toLinear(value & 255)
  )
}

/** WCAG contrast ratio between two `#rrggbb` colors, 1-21. */
export function contrastRatio(a: string, b: string) {
  const la = relativeLuminance(normalizeHex(a) ?? '#000000')
  const lb = relativeLuminance(normalizeHex(b) ?? '#000000')
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Outline color for a name fill: the near-black edge we use everywhere, unless
 * the fill is dark enough that a dark edge would disappear into it, in which
 * case white. For a gradient the choice maximizes the worst stop's contrast,
 * because a single edge has to work across the whole run.
 */
export function outlineColorFor(fill: string | string[]): string {
  const fills = (Array.isArray(fill) ? fill : [fill]).map(
    color => normalizeHex(color) ?? '#000000',
  )
  if (fills.length === 0) return DARK_OUTLINE
  const dark = Math.min(...fills.map(color => contrastRatio(color, DARK_OUTLINE)))
  const light = Math.min(...fills.map(color => contrastRatio(color, LIGHT_OUTLINE)))
  // A tie keeps the dark edge, which is what the curated gradients target.
  return light > dark ? LIGHT_OUTLINE : DARK_OUTLINE
}

function mixHue(from: number, to: number, t: number) {
  const delta = ((to - from + 540) % 360) - 180
  return (from + delta * t + 360) % 360
}

/** Interpolates between two stops in OKLCH, taking the shorter hue arc. */
export function interpolateOklch(from: Oklch, to: Oklch, t: number): Oklch {
  // A near-gray stop carries no useful hue, so it takes the other stop's hue
  // instead of swinging through a random angle while its chroma grows.
  const hue = from.c < 0.02 ? to.h : to.c < 0.02 ? from.h : mixHue(from.h, to.h, t)
  return {
    l: from.l + (to.l - from.l) * t,
    c: from.c + (to.c - from.c) * t,
    h: hue,
  }
}

/** Colors of a gradient, ignoring anything that does not parse as hex. */
function gradientStops(colors: string[]): Oklch[] {
  const stops: Oklch[] = []
  for (const color of colors) {
    const stop = hexToOklch(color)
    if (stop) stops.push(stop)
  }
  return stops
}

/**
 * Color at `fraction` (0-1) along `colors`. Used per grapheme on native and to
 * build the multi-stop web gradient.
 */
export function sampleGradient(colors: string[], fraction: number): string {
  const stops = gradientStops(colors)
  if (stops.length === 0) return normalizeHex(colors[0]) ?? '#000000'
  if (stops.length === 1) return oklchToHex(stops[0])

  const position = clamp(fraction, 0, 1) * (stops.length - 1)
  const start = Math.min(Math.floor(position), stops.length - 2)
  const t = position - start
  return oklchToHex(interpolateOklch(stops[start], stops[start + 1], t))
}

/**
 * Evenly spaced samples of a gradient. Browsers interpolate hex stops in sRGB;
 * feeding them enough OKLCH samples makes the visible ramp match the native
 * per-grapheme renderer without relying on `in oklch` support.
 */
export function gradientSamples(colors: string[], count = 9): string[] {
  if (colors.length < 2) return colors.map(color => normalizeHex(color) ?? color)
  const samples: string[] = []
  for (let index = 0; index < count; index++) {
    samples.push(sampleGradient(colors, index / (count - 1)))
  }
  return samples
}
