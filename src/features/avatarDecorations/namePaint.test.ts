import {resolveNamePaint} from './namePaint'

const CURATED = {name: 'sunset'}

it('prefers a custom gradient over a custom color and a curated name', () => {
  const paint = resolveNamePaint({
    ...CURATED,
    nameColor: '#123456',
    nameGradient: {colors: ['#FF0000', '#0000FF']},
  })
  expect(paint?.gradient?.colors).toEqual(['#FF0000', '#0000FF'])
  expect(paint?.gradient?.solid).toBeTruthy()
  expect(paint?.color).toBeUndefined()
})

it('prefers a custom color over a curated name', () => {
  const paint = resolveNamePaint({...CURATED, nameColor: '#123456'})
  expect(paint?.color).toBe('#123456')
  expect(paint?.gradient).toBeUndefined()
})

it('falls back to the curated gradient', () => {
  expect(resolveNamePaint(CURATED)?.gradient?.colors.length).toBe(3)
})

it('maps a hard custom gradient to segmented bands', () => {
  const paint = resolveNamePaint({
    nameGradient: {colors: ['#FF0000', '#0000FF'], hard: true},
  })
  expect(paint?.gradient?.segmented).toBe(true)
})

it('ignores custom paints and faces when the viewer opted out', () => {
  expect(
    resolveNamePaint(
      {
        ...CURATED,
        nameColor: '#123456',
        nameFont: 'Inter',
        nameOutline: true,
      },
      {customDisabled: true},
    ),
  ).toEqual({gradient: expect.anything(), outline: true})
})

it('keeps a font that ships and drops one that does not', () => {
  expect(resolveNamePaint({nameFont: 'Inter'})?.font).toBe('Inter')
  expect(resolveNamePaint({nameFont: 'Not A Real Font'})).toBeUndefined()
})

it('edges only when the author asked and a paint exists', () => {
  expect(resolveNamePaint({...CURATED, nameOutline: true})?.outline).toBe(true)
  expect(resolveNamePaint(CURATED)?.outline).toBe(false)
  expect(resolveNamePaint({nameFont: 'Inter'})?.outline).toBe(false)
  expect(
    resolveNamePaint({nameFont: 'Inter', nameOutline: true})?.outline,
  ).toBe(false)
})

it('applies the viewer outline preference to painted names only', () => {
  expect(resolveNamePaint(CURATED, {forceOutline: true})?.outline).toBe(true)
  expect(
    resolveNamePaint({nameFont: 'Inter'}, {forceOutline: true})?.outline,
  ).toBe(false)
})
