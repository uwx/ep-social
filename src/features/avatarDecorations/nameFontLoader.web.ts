import {fontFaceCss, parseFontFaces} from './fontCss'

const injected = new Set<string>()

/**
 * Web side of the runtime font loader: injects the css2 response under `alias`
 * and waits for the browser to have at least one face ready.
 *
 * The browser's own `User-Agent` is left alone, so Google answers with woff2
 * split by `unicode-range`: a latin display name downloads only the latin
 * subset, typically 10-40 KB instead of a 250 KB TTF. `expo-font`'s web loader
 * cannot express `unicode-range`, hence the raw `@font-face` injection.
 */
export async function registerFontFamily(
  alias: string,
  cssUrl: string,
  text?: string,
): Promise<void> {
  const res = await fetch(cssUrl, {headers: {accept: 'text/css'}})
  if (!res.ok) throw new Error(`Font css failed: ${res.status}`)
  const faces = parseFontFaces(await res.text())
  if (faces.length === 0) throw new Error('Font css had no face')

  if (!injected.has(alias)) {
    const style = document.createElement('style')
    style.setAttribute('data-name-font', alias)
    style.textContent = fontFaceCss(alias, faces)
    document.head.appendChild(style)
    injected.add(alias)
  }

  if (typeof document.fonts?.load === 'function') {
    /*
     * Resolves once the face covering `text` (a `text=` subset request has no
     * other glyphs) is ready; any other range loads on use.
     */
    await document.fonts.load(`1em "${alias}"`, text)
  }
}
