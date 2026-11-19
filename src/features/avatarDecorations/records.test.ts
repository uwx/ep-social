import {
  buildDecorationRecord,
  getDecorationSettings,
  parseDecorationSettings,
  SETTINGS_COLLECTION,
  SETTINGS_RKEY,
} from './records'

const SUBJECT = 'did:plc:subscriber'
const SLINGSHOT = 'https://slingshot.microcosm.blue'
const originalFetch = global.fetch

describe('getDecorationSettings', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('reads the settings record through slingshot', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          value: {
            $type: SETTINGS_COLLECTION,
            avatar: 'gold-ring',
            avatarShape: 'hexagon',
            name: 'sunset',
            nameOutline: true,
          },
        }),
    } as Response)

    await expect(getDecorationSettings(SUBJECT, SLINGSHOT)).resolves.toEqual({
      avatar: 'gold-ring',
      avatarShape: 'hexagon',
      name: 'sunset',
      nameOutline: true,
    })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.origin).toBe(SLINGSHOT)
    expect(url.pathname).toBe('/xrpc/com.atproto.repo.getRecord')
    expect(url.searchParams.get('repo')).toBe(SUBJECT)
    expect(url.searchParams.get('collection')).toBe(SETTINGS_COLLECTION)
    expect(url.searchParams.get('rkey')).toBe(SETTINGS_RKEY)
  })

  it('treats a missing record as no decoration', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({error: 'RecordNotFound'}),
    } as Response)

    await expect(getDecorationSettings(SUBJECT, SLINGSHOT)).resolves.toEqual({})
  })

  it('throws on a real service failure', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.resolve({}),
    } as Response)

    await expect(getDecorationSettings(SUBJECT, SLINGSHOT)).rejects.toThrow(
      'Slingshot getRecord failed: 502',
    )
  })
})

describe('parseDecorationSettings', () => {
  it('drops unknown and malformed slots', () => {
    expect(
      parseDecorationSettings({
        avatar: 42,
        avatarShape: 'octagon',
        name: 'sunset',
        nameOutline: 'yes',
      }),
    ).toEqual({name: 'sunset'})
  })

  it('accepts every supported avatar shape', () => {
    for (const shape of ['circle', 'square', 'squircle', 'hexagon']) {
      expect(parseDecorationSettings({avatarShape: shape})).toEqual({
        avatarShape: shape,
      })
    }
  })

  it('returns an empty object for a missing record value', () => {
    expect(parseDecorationSettings(undefined)).toEqual({})
    expect(parseDecorationSettings(null)).toEqual({})
  })
})

describe('buildDecorationRecord', () => {
  it('carries over slots the patch does not touch', () => {
    const record = buildDecorationRecord(
      {avatar: 'gold-ring', name: 'sunset', nameOutline: true},
      {name: 'ocean'},
    )
    expect(record).toMatchObject({
      $type: SETTINGS_COLLECTION,
      avatar: 'gold-ring',
      name: 'ocean',
      nameOutline: true,
    })
    expect(typeof record.updatedAt).toBe('string')
  })

  it('omits a cleared slot instead of writing undefined', () => {
    const record = buildDecorationRecord(
      {avatar: 'gold-ring', name: 'sunset', nameOutline: true},
      {name: undefined},
    )
    expect(record).not.toHaveProperty('name')
    expect(record).not.toHaveProperty('nameOutline')
    expect(record).toMatchObject({avatar: 'gold-ring'})
  })

  it('drops the outline when the gradient it belongs to is cleared', () => {
    expect(
      buildDecorationRecord({nameOutline: true}, {name: undefined}),
    ).not.toHaveProperty('nameOutline')
  })

  it('writes a shape on its own', () => {
    expect(buildDecorationRecord({}, {avatarShape: 'hexagon'})).toMatchObject({
      avatarShape: 'hexagon',
    })
  })
})
