import {nameGradientTextStyle} from './nameGradientStyle.web'

it('paints a smooth gradient with background-clip text', () => {
  const style = nameGradientTextStyle({
    colors: ['#FF0000', '#0000FF'],
    solid: '#FF0000',
  }) as Record<string, unknown>

  expect(style.backgroundImage).toBe('linear-gradient(90deg, #FF0000, #0000FF)')
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

it('outlines with an edge shadow rather than a text stroke', () => {
  const style = nameGradientTextStyle(
    {colors: ['#FF0000', '#0000FF'], solid: '#FF0000'},
    {outline: true},
  ) as Record<string, unknown>

  expect(String(style.filter)).toContain('drop-shadow(2px 0 0 #050408)')
  // The fill must stay a gradient; a stroke would hide it.
  expect(style.WebkitTextStroke).toBeUndefined()
  expect(style.color).toBe('transparent')
})
