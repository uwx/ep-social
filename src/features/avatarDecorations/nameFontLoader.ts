import {loadAsync} from 'expo-font'

import {parseFontFaces} from './fontCss'

/**
 * Native side of the runtime font loader: resolves a css2 response to a single
 * TTF and registers it under `alias`.
 *
 * The response holds one `@font-face` when the request does not look like a
 * browser, which is why `nameFonts.ts` sends a non-browser `User-Agent`.
 * `expo-font` then downloads the file itself and caches it on disk.
 */
export async function registerFontFamily(
  alias: string,
  cssUrl: string,
  // Only web's `document.fonts.load` needs the text; native takes the URL alone.
  _text?: string,
): Promise<void> {
  const res = await fetch(cssUrl, {
    headers: {accept: 'text/css', 'user-agent': 'okhttp/4.12.0'},
  })
  if (!res.ok) throw new Error(`Font css failed: ${res.status}`)
  const face = parseFontFaces(await res.text())[0]
  if (!face) throw new Error('Font css had no face')
  await loadAsync(alias, face.url)
}
