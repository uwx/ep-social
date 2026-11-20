jest.mock('./nameFontLoader', () => ({registerFontFamily: jest.fn()}))

import {registerFontFamily} from './nameFontLoader'
import {
  ensureNameFont,
  ensureNameFontPreview,
  getNameFontState,
  nameFontAlias,
  resetNameFonts,
} from './nameFonts'

const register = registerFontFamily as jest.MockedFunction<
  typeof registerFontFamily
>

/** Lets the loader's `then`/`catch`/`finally` chain settle, without timers. */
async function flush() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  resetNameFonts()
  register.mockReset()
  register.mockResolvedValue(undefined)
})

it('derives a collision-free alias from the family name', () => {
  expect(nameFontAlias('Open Sans')).toBe('nf_open_sans')
  expect(nameFontAlias('M PLUS Rounded 1c')).toBe('nf_m_plus_rounded_1c')
})

it('requests a family once no matter how many names use it', async () => {
  ensureNameFont('Roboto')
  ensureNameFont('Roboto')
  ensureNameFont('Roboto')

  expect(register).toHaveBeenCalledTimes(1)
  expect(register).toHaveBeenCalledWith(
    'nf_roboto',
    'https://fonts.googleapis.com/css2?family=Roboto&display=swap',
    undefined,
  )

  await flush()
  expect(getNameFontState('nf_roboto')).toBe('loaded')
})

it('ignores a family this build does not ship', () => {
  ensureNameFont('Definitely Not A Google Font')

  expect(register).not.toHaveBeenCalled()
})

it('loads the picker subset under its own alias with the text parameter', async () => {
  ensureNameFontPreview('Open Sans')

  expect(register).toHaveBeenCalledWith(
    'nf_open_sans__preview',
    'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap&text=Open+Sans',
    // Handed to `document.fonts.load`, so the alias opens only once the subset
    // covering the row's own glyphs is ready.
    'Open Sans',
  )

  await flush()
  expect(getNameFontState('nf_open_sans__preview')).toBe('loaded')
})

it('remembers a failure instead of retrying on every render', async () => {
  register.mockRejectedValueOnce(new Error('offline'))

  ensureNameFont('Roboto')
  await flush()
  ensureNameFont('Roboto')

  expect(register).toHaveBeenCalledTimes(1)
  expect(getNameFontState('nf_roboto')).toBe('error')
})

it('keeps at most three requests in flight', async () => {
  ensureNameFont('Roboto')
  ensureNameFont('Open Sans')
  ensureNameFont('Inter')
  ensureNameFont('Lato')
  ensureNameFont('Pacifico')

  expect(register).toHaveBeenCalledTimes(3)

  await flush()
  expect(register).toHaveBeenCalledTimes(5)
})
