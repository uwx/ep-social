import {fontCssUrl, fontFaceCss, parseFontFaces} from './fontCss'

/*
 * Real responses from fonts.googleapis.com/css2. A browser UA gets woff2 split
 * by `unicode-range`; a plain client gets one TTF with no range.
 */
const BROWSER_CSS = `
/* latin */
@font-face {
  font-family: 'Pacifico';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/pacifico/v23/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC;
}
/* latin-ext */
@font-face {
  font-family: 'Pacifico';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/pacifico/v23/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5;
}
`

const PLAIN_CSS = `
@font-face {
  font-family: 'Pacifico';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/pacifico/v23/FwZY7-Qmy14u9lezJ96A.ttf) format('truetype');
}
`

it('requests one family, optionally subset to the given text', () => {
  expect(fontCssUrl('Pacifico')).toBe(
    'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  )
  // URLSearchParams encodes the space in "Pacifico Ada".
  expect(fontCssUrl('Pacifico', 'Ada Lovelace')).toContain('text=Ada+Lovelace')
})

it('reads every face of a browser response with its unicode range', () => {
  const faces = parseFontFaces(BROWSER_CSS)

  expect(faces).toHaveLength(2)
  expect(faces[0].url).toBe(
    'https://fonts.gstatic.com/s/pacifico/v23/FwZY7-Qmy14u9lezJ-6H6MmBp0u-.woff2',
  )
  expect(faces[0].unicodeRange).toBe(
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC',
  )
  expect(faces[1].unicodeRange).toBe('U+0100-02BA, U+02BD-02C5')
})

it('reads the single face of a plain response', () => {
  const faces = parseFontFaces(PLAIN_CSS)

  expect(faces).toHaveLength(1)
  expect(faces[0].url).toBe(
    'https://fonts.gstatic.com/s/pacifico/v23/FwZY7-Qmy14u9lezJ96A.ttf',
  )
  expect(faces[0].unicodeRange).toBeUndefined()
})

it('serves the response under an alias, keeping the ranges', () => {
  const css = fontFaceCss('nf_pacifico', parseFontFaces(BROWSER_CSS))

  expect(css.match(/@font-face\{/g)).toHaveLength(2)
  expect(css).toContain('font-family:"nf_pacifico"')
  expect(css).toContain('font-weight:400')
  expect(css).toContain('font-style:normal')
  expect(css).toContain('unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC')
})

it('drops a block with no url', () => {
  expect(parseFontFaces('@font-face { font-family: X; }')).toEqual([])
})
