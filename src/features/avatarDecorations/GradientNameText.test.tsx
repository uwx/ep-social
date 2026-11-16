import {render} from '@testing-library/react-native'
import type {ReactTestRendererJSON} from 'react-test-renderer'

import {GradientNameText} from './GradientNameText'

/** Concatenates every rendered text leaf, in document order. */
function collectText(
  node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null,
): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(collectText).join('')
  return (node.children ?? []).map(collectText).join('')
}

jest.mock('#/platform/ui-text-view', () => ({
  UITextView:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))

it('keeps every grapheme of the name, in order', () => {
  const name = 'Ada Lovelace'
  const {toJSON} = render(
    <GradientNameText gradient={{colors: ['#FF0000', '#0000FF'], solid: '#FF0000'}}>
      {name}
    </GradientNameText>,
  )

  // Splitting for color must not lose, reorder, or duplicate any character.
  expect(collectText(toJSON())).toBe(name)
})

it('gives the first and last letters the gradient end colors', () => {
  const {getByText} = render(
    <GradientNameText gradient={{colors: ['#FF0000', '#0000FF'], solid: '#FF0000'}}>
      ab
    </GradientNameText>,
  )

  expect(getByText('a')).toHaveStyle({color: 'rgb(255, 0, 0)'})
  expect(getByText('b')).toHaveStyle({color: 'rgb(0, 0, 255)'})
})

it('bands segmented gradients into flat colors instead of blending', () => {
  const {getByText} = render(
    <GradientNameText
      gradient={{colors: ['#FF0000', '#00FF00'], solid: '#FF0000', segmented: true}}>
      abcd
    </GradientNameText>,
  )

  expect(getByText('a')).toHaveStyle({color: '#FF0000'})
  expect(getByText('b')).toHaveStyle({color: '#FF0000'})
  expect(getByText('c')).toHaveStyle({color: '#00FF00'})
  expect(getByText('d')).toHaveStyle({color: '#00FF00'})
})

it('leaves emoji in their own colors', () => {
  const {getByText} = render(
    <GradientNameText gradient={{colors: ['#FF0000', '#0000FF'], solid: '#FF0000'}}>
      {'a🎉b'}
    </GradientNameText>,
  )

  expect(getByText('🎉')).toHaveStyle({fontFamily: 'System'})
})
