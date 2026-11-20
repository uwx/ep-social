import {nameGradientTextStyle} from './nameGradientStyle.web'

/** Stops of a `linear-gradient(90deg, ...)` string. */
function stops(style: Record<string, unknown>): string[] {
  const match = /^linear-gradient\(90deg, (.*)\)$/.exec(
    String(style.backgroundImage),
  )
  return match ? match[1].split(', ') : []
}

it('paints a smooth gradient with background-clip text', () => {
  const style = nameGradientTextStyle({
    colors: ['#FF0000', '#0000FF'],
    solid: '#FF0000',
  }) as Record<string, unknown>

  const painted = stops(style)
  // Sampled in OKLCH so the browser's sRGB interpolation cannot bend the ramp,
  // which means more stops than the record holds but the same endpoints.
  expect(painted.length).toBe(9)
  expect(painted[0]).toBe('#ff0000')
  expect(painted[painted.length - 1]).toBe('#0000ff')
  expect(style.backgroundClip).toBe('text')
  expect(style.WebkitBackgroundClip).toBe('text')
  expect(style.color).toBe('transparent')
  expect(style.WebkitTextFillColor).toBe('transparent')
})

it('turns segmented gradients into hard color bands', () => {
  const style = nameGradientTextStyle({
    colors: ['#FF0000', '#00FF00'],
    solid: '#FF0000',
    segmented: true,
  }) as Record<string, unknown>

  expect(style.backgroundImage).toBe(
    'linear-gradient(90deg, #FF0000 0% 50%, #00FF00 50% 100%)',
  )
})

it('outlines a mid-tone gradient in white so the edge reads', () => {
  const style = nameGradientTextStyle(
    {colors: ['#FF0000', '#0000FF'], solid: '#FF0000'},
    {outline: true},
  ) as Record<string, unknown>

  // Red is light enough that a dark edge beats a white one, blue is not; the
  // edge maximizes the contrast of the worst stop, so white wins here.
  expect(String(style.filter)).toContain('drop-shadow(2px 0 0 #ffffff)')
  // The fill must stay a gradient; a stroke would hide it.
  expect(style.WebkitTextStroke).toBeUndefined()
  expect(style.color).toBe('transparent')
})

it('outlines a pale gradient in dark so the edge reads', () => {
  const style = nameGradientTextStyle(
    {colors: ['#FFE9A8', '#F7F7F7'], solid: '#FFE9A8'},
    {outline: true},
  ) as Record<string, unknown>

  expect(String(style.filter)).toContain('drop-shadow(2px 0 0 #050408)')
})

it('edges a flat fill and keeps the fill color', () => {
  const style = nameGradientTextStyle(
    {colors: ['#FF0000'], solid: '#FF0000'},
    {outline: true},
  ) as Record<string, unknown>

  expect(style.color).toBe('#FF0000')
  expect(style.backgroundImage).toBeUndefined()
  // A single mid-light fill reads better with a dark edge.
  expect(String(style.filter)).toContain('drop-shadow(2px 0 0 #050408)')
})
