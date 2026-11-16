import {
  getDeltaLabel,
  isFictionkinAccount,
  KIN_CHARACTERS,
  KIN_TYPES,
  parseDeltaLabel,
} from './fictionkinLabels'

const did = 'did:plc:subject'

function label(val: string, src = did) {
  return {
    val,
    src,
    uri: `at://${src}/com.atproto.label.defs#selfLabels`,
    cts: '2026-01-01T00:00:00.000Z',
  }
}

describe('parseDeltaLabel', () => {
  it('parses every character and kin combination', () => {
    for (const character of KIN_CHARACTERS) {
      for (const kin of KIN_TYPES) {
        expect(parseDeltaLabel(`dr-${character}-${kin}`)).toEqual({
          character,
          kin,
        })
      }
    }
  })

  it('rejects unknown characters, kin types, and other labels', () => {
    expect(parseDeltaLabel('dr-tenna-s')).toBeUndefined()
    expect(parseDeltaLabel('dr-kris-therian')).toBeUndefined()
    expect(parseDeltaLabel('pet')).toBeUndefined()
    expect(parseDeltaLabel('dr-kris')).toBeUndefined()
    expect(parseDeltaLabel('xdr-kris-s')).toBeUndefined()
  })
})

describe('getDeltaLabel', () => {
  it('reads the account own label', () => {
    expect(getDeltaLabel({did, labels: [label('dr-susie-fictive')]})).toEqual({
      character: 'susie',
      kin: 'fictive',
    })
  })

  it('ignores a label applied by someone else', () => {
    // Someone else's label is not a claim this account made.
    expect(
      getDeltaLabel({
        did,
        labels: [label('dr-susie-fictive', 'did:plc:other')],
      }),
    ).toBeUndefined()
  })

  it('ignores unrelated self-labels', () => {
    expect(
      getDeltaLabel({did, labels: [label('pet'), label('bot')]}),
    ).toBeUndefined()
  })

  it('skips an unknown character to find a valid label', () => {
    expect(
      getDeltaLabel({
        did,
        labels: [label('dr-tenna-s'), label('dr-noelle-otherkin')],
      }),
    ).toEqual({character: 'noelle', kin: 'otherkin'})
  })

  it('handles a profile with no labels', () => {
    expect(getDeltaLabel({did})).toBeUndefined()
    expect(isFictionkinAccount({did})).toBe(false)
  })
})
