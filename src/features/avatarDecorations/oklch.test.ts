import {
  contrastRatio,
  DARK_OUTLINE,
  gradientSamples,
  hexToOklch,
  interpolateOklch,
  LIGHT_OUTLINE,
  normalizeHex,
  oklchToHex,
  outlineColorFor,
  sampleGradient,
} from './oklch'

describe('normalizeHex', () => {
  it('expands shorthand and lowercases', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc')
    expect(normalizeHex('AABBCC')).toBe('#aabbcc')
  })

  it('rejects anything that is not a hex color', () => {
    expect(normalizeHex('red')).toBeNull()
    expect(normalizeHex('#12345')).toBeNull()
    expect(normalizeHex(42)).toBeNull()
    expect(normalizeHex(undefined)).toBeNull()
  })
})

describe('hexToOklch', () => {
  it('matches the CSS Color 4 reference values', () => {
    expect(hexToOklch('#FF0000')).toMatchObject({
      l: expect.closeTo(0.6279, 3),
      c: expect.closeTo(0.2577, 3),
      h: expect.closeTo(29.23, 1),
    })
    expect(hexToOklch('#0000FF')).toMatchObject({
      l: expect.closeTo(0.452, 3),
      c: expect.closeTo(0.3132, 3),
      h: expect.closeTo(264.05, 1),
    })
  })

  it('treats white, black, and gray as achromatic', () => {
    for (const hex of ['#ffffff', '#000000', '#808080']) {
      expect(hexToOklch(hex)!.c).toBeLessThan(0.001)
    }
    expect(hexToOklch('#ffffff')!.l).toBeCloseTo(1, 5)
    expect(hexToOklch('#000000')!.l).toBeCloseTo(0, 5)
  })

  it('returns null for invalid input', () => {
    expect(hexToOklch('nope')).toBeNull()
  })
})

describe('oklchToHex', () => {
  it('round-trips every channel of a saturated color', () => {
    for (const hex of ['#ffd700', '#28acdc', '#f2571f', '#a052ff', '#e9cf00']) {
      expect(oklchToHex(hexToOklch(hex)!)).toBe(hex)
    }
  })

  it('reduces chroma, not lightness, to leave sRGB', () => {
    const hex = oklchToHex({l: 0.62, c: 0.4, h: 300})
    const back = hexToOklch(hex)!
    // A pure channel clip would drag L and H with it.
    expect(back.l).toBeCloseTo(0.62, 2)
    expect(back.h).toBeCloseTo(300, 0)
    expect(back.c).toBeLessThan(0.4)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('clamps lightness outside 0-1', () => {
    expect(oklchToHex({l: 2, c: 0, h: 0})).toBe('#ffffff')
    expect(oklchToHex({l: -1, c: 0, h: 0})).toBe('#000000')
  })
})

describe('interpolateOklch', () => {
  it('takes the shorter hue arc across 0 degrees', () => {
    const mid = interpolateOklch({l: 0.5, c: 0.1, h: 350}, {l: 0.5, c: 0.1, h: 10}, 0.5)
    expect(mid.h).toBeCloseTo(0, 5)
  })

  it('ignores the hue of an achromatic stop', () => {
    const mid = interpolateOklch({l: 0.5, c: 0, h: 90}, {l: 0.5, c: 0.1, h: 200}, 0.5)
    expect(mid.h).toBeCloseTo(200, 5)
  })
})

describe('sampleGradient', () => {
  it('returns the exact stops at the ends', () => {
    expect(sampleGradient(['#ff0000', '#0000ff'], 0)).toBe('#ff0000')
    expect(sampleGradient(['#ff0000', '#0000ff'], 1)).toBe('#0000ff')
  })

  it('passes through the middle stop of a three-color gradient', () => {
    expect(
      sampleGradient(['#ff0000', '#00ff00', '#0000ff'], 0.5),
    ).toBe('#00ff00')
  })

  it('degrades to the single color it was given', () => {
    expect(sampleGradient(['#123456'], 0.5)).toBe('#123456')
    expect(sampleGradient([], 0.5)).toBe('#000000')
  })

  it('spreads samples across the whole ramp', () => {
    const samples = gradientSamples(['#ff0000', '#0000ff'], 5)
    expect(samples).toHaveLength(5)
    expect(samples[0]).toBe('#ff0000')
    expect(samples[4]).toBe('#0000ff')
    // OKLCH blending of red to blue passes through a desaturated violet rather
    // than the muddy channel average sRGB would produce.
    expect(new Set(samples).size).toBe(5)
  })
})

describe('outlineColorFor', () => {
  it('keeps the dark edge on a bright fill', () => {
    expect(outlineColorFor('#ffd700')).toBe(DARK_OUTLINE)
    expect(outlineColorFor('#28acdc')).toBe(DARK_OUTLINE)
  })

  it('flips to white when the fill is dark enough to swallow the edge', () => {
    expect(outlineColorFor('#000000')).toBe(LIGHT_OUTLINE)
    expect(outlineColorFor('#202020')).toBe(LIGHT_OUTLINE)
  })

  it('always leaves at least a 3:1 fill-to-edge ratio', () => {
    for (const hex of ['#ff0000', '#0000ff', '#00ff00', '#777777', '#101010']) {
      expect(contrastRatio(hex, outlineColorFor(hex))).toBeGreaterThanOrEqual(3)
    }
  })
})
