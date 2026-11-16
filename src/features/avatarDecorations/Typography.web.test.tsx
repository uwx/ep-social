/** @jest-environment jsdom */

import {act} from 'react'
import {createRoot} from 'react-dom/client'

import {Text} from '#/components/Typography'
import {NAME_GRADIENTS} from './nameGradients'

jest.mock('react-native', () => jest.requireActual('react-native-web'))
jest.mock('#/logger', () => ({logger: {warn: () => {}}}))
jest.mock('#/env', () => ({IS_WEB: true, IS_IOS: false, IS_NATIVE: false}))
jest.mock('#/alf', () => ({
  atoms: {text_sm: {fontSize: 14}, leading_snug: {lineHeight: 1.25}},
  native: () => undefined,
  platform: () => undefined,
  utils: {alpha: (color: string) => color},
  useAlf: () => ({
    fonts: {scaleMultiplier: 1, family: 'system', letterSpacing: 0},
    flags: {},
  }),
  useTheme: () => ({
    atoms: {
      text: {color: '#111111'},
      text_contrast_medium: {color: '#555555'},
    },
    palette: {primary_500: '#ed5345'},
  }),
  web: (value: unknown) => value,
}))
jest.mock('#/alf/typography', () => ({
  childHasEmoji: () => false,
  normalizeTextStyles: (styles: unknown[]) =>
    Object.assign({}, ...styles.flat(Infinity).filter(Boolean)),
  renderChildrenWithEmoji: (children: React.ReactNode) => children,
}))

function renderInto(node: React.ReactNode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    createRoot(container).render(node)
  })
  return container
}

it('paints the name with the gradient and hides the base color', () => {
  const gradient = NAME_GRADIENTS.find(g => g.id === 'sunset')!
  const container = renderInto(<Text gradient={gradient}>Ada Lovelace</Text>)

  const name = container.firstElementChild as HTMLElement
  expect(name.textContent).toBe('Ada Lovelace')
  // RNW emits background-clip: text with a transparent fill.
  expect(name.style.backgroundClip || name.style.webkitBackgroundClip).toBe(
    'text',
  )
  // The browser normalizes `transparent` to a zero-alpha color.
  expect(name.style.color).toBe('rgba(0, 0, 0, 0)')
  expect(name.style.backgroundImage).toContain('#FF9D2B')
})

it('leaves plain text alone when there is no gradient', () => {
  const container = renderInto(<Text>Ada Lovelace</Text>)

  const name = container.firstElementChild as HTMLElement
  expect(name.style.backgroundImage).toBe('')
  expect(name.style.color).toBe('rgb(17, 17, 17)')
})
