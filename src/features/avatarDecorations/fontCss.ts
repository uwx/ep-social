/**
 * Parsing for the Google Fonts css2 endpoint.
 *
 * The endpoint answers with one `@font-face` block per unicode range (browsers)
 * or a single block (plain clients). We always want the URL out of it, and on
 * web we also want the `unicode-range` so the browser can download only the
 * subset the name actually uses.
 */

export type FontFace = {
  url: string
  /** CSS `unicode-range` list, absent for a `text=` subset. */
  unicodeRange?: string
  weight?: string
  style?: string
}

/** Public css2 URL. `text` requests a subset covering exactly those glyphs. */
export function fontCssUrl(family: string, text?: string): string {
  const query = new URLSearchParams({family, display: 'swap'})
  if (text) query.set('text', text)
  return `https://fonts.googleapis.com/css2?${query.toString()}`
}

const BLOCK_RE = /@font-face\s*\{([^}]*)\}/g

/** Every usable `@font-face` in a css2 response. */
export function parseFontFaces(css: string): FontFace[] {
  const faces: FontFace[] = []
  for (const block of css.matchAll(BLOCK_RE)) {
    const body = block[1]
    const url = /url\(\s*['"]?([^)'"]+)['"]?\s*\)/.exec(body)?.[1]
    if (!url) continue
    const unicodeRange = /unicode-range\s*:\s*([^;]+)/i.exec(body)?.[1].trim()
    const weight = /font-weight\s*:\s*([^;]+)/i.exec(body)?.[1].trim()
    const style = /font-style\s*:\s*([^;]+)/i.exec(body)?.[1].trim()
    faces.push({
      url,
      ...(unicodeRange ? {unicodeRange} : {}),
      ...(weight ? {weight} : {}),
      ...(style ? {style} : {}),
    })
  }
  return faces
}

/** `@font-face` rules that serve a css2 response under `alias`. */
export function fontFaceCss(alias: string, faces: FontFace[]): string {
  return faces
    .map(face => {
      const declarations = [
        `font-family:${JSON.stringify(alias)}`,
        `src:url(${JSON.stringify(face.url)})`,
        `font-display:swap`,
        `font-weight:${face.weight ?? 400}`,
        `font-style:${face.style ?? 'normal'}`,
      ]
      if (face.unicodeRange) {
        declarations.push(`unicode-range:${face.unicodeRange}`)
      }
      return `@font-face{${declarations.join(';')}}`
    })
    .join('\n')
}
