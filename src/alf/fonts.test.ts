import {applyFonts, type MutableTextStyle} from './fonts.shared'

jest.mock('#/env', () => ({IS_ANDROID: false, IS_WEB: false}))

describe('applyFonts', () => {
  it('adds letter spacing to the system font by default', () => {
    const style: MutableTextStyle = {}
    applyFonts(style, 'system')
    expect(style.letterSpacing).toBe(0.25)
  })

  it('leaves the system font alone when letter spacing is disabled', () => {
    const style: MutableTextStyle = {}
    applyFonts(style, 'system', false)
    expect(style.letterSpacing).toBeUndefined()
    expect(style.fontFamily).toBeUndefined()
  })

  it('never adds letter spacing to the theme font', () => {
    const style: MutableTextStyle = {}
    applyFonts(style, 'theme', true)
    expect(style.fontFamily).toBe('InterVariable')
    expect(style.letterSpacing).toBeUndefined()
  })

  it('keeps a family the caller set, dropping the weight it cannot render', () => {
    const style: MutableTextStyle = {
      fontFamily: 'nf_pacifico',
      fontWeight: '700',
      fontStyle: 'italic',
    }
    applyFonts(style, 'theme', true)
    expect(style.fontFamily).toBe('nf_pacifico')
    expect(style.fontWeight).toBeUndefined()
    expect(style.fontStyle).toBeUndefined()
    // The theme font would have added letter spacing; a face of its own does not.
    expect(style.letterSpacing).toBeUndefined()
  })
})
