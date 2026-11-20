import {DECORATION_FRAMES, resolveFrame} from './catalog'

it('returns the curated frame as-is when the record names no color', () => {
  const frame = DECORATION_FRAMES[0]
  expect(resolveFrame(frame.id, undefined)).toBe(frame)
})

it('replaces a curated frame color with the record color', () => {
  const frame = DECORATION_FRAMES[0]
  expect(resolveFrame(frame.id, '#123456')).toEqual({
    ...frame,
    color: '#123456',
  })
})

it('draws a ring when a record names a color but no frame', () => {
  expect(resolveFrame(undefined, '#123456')).toMatchObject({color: '#123456'})
})

it('draws nothing for a record with no frame and no color', () => {
  expect(resolveFrame(undefined, undefined)).toBeUndefined()
  expect(resolveFrame('not-a-frame', undefined)).toBeUndefined()
})
