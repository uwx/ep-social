import {applyFictionkinLabel} from './fictionkinApplyLabel'

function selfLabels(...vals: string[]) {
  return {
    $type: 'com.atproto.label.defs#selfLabels',
    values: vals.map(val => ({val})),
  }
}

it('adds the badge without touching other self-labels', () => {
  const result = applyFictionkinLabel(
    {labels: selfLabels('pet', 'bot')},
    {character: 'kris', kin: 's'},
  )

  expect(result.labels?.values).toEqual([
    {val: 'pet'},
    {val: 'bot'},
    {val: 'dr-kris-s'},
  ])
})

it('replaces an existing badge so a person holds only one', () => {
  const result = applyFictionkinLabel(
    {labels: selfLabels('pet', 'dr-susie-fictive')},
    {character: 'noelle', kin: 'otherkin'},
  )

  expect(result.labels?.values).toEqual([
    {val: 'pet'},
    {val: 'dr-noelle-otherkin'},
  ])
})

it('removes only the badge when the choice is cleared', () => {
  const result = applyFictionkinLabel(
    {labels: selfLabels('pet', 'dr-kris-s', 'pvp')},
    undefined,
  )

  expect(result.labels?.values).toEqual([{val: 'pet'}, {val: 'pvp'}])
})

it('drops the labels field entirely when nothing is left', () => {
  const result = applyFictionkinLabel(
    {labels: selfLabels('dr-kris-s')},
    undefined,
  )

  expect(result).not.toHaveProperty('labels')
})

it('creates labels on a profile that had none', () => {
  const result = applyFictionkinLabel({}, {character: 'ralsei', kin: 'badge'})

  expect(result.labels).toEqual({
    $type: 'com.atproto.label.defs#selfLabels',
    values: [{val: 'dr-ralsei-badge'}],
  })
})

it('ignores a malformed labels value instead of throwing', () => {
  const result = applyFictionkinLabel(
    {labels: 'nonsense'},
    {character: 'susie', kin: 's'},
  )

  expect(result.labels?.values).toEqual([{val: 'dr-susie-s'}])
})
