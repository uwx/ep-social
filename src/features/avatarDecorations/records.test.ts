import {
  buildDecorationRecord,
  getDecorationSettings,
  hasDecorationEntitlement,
  parseDecorationSettings,
  SETTINGS_COLLECTION,
  SETTINGS_RKEY,
} from './records'

const PROD_LIST =
  'at://did:plc:issuer/app.bsky.graph.list/production-subscribers'
const TEST_LIST = 'at://did:plc:issuer/app.bsky.graph.list/test-subscribers'
const SUBJECT = 'did:plc:subscriber'
const CONSTELLATION = 'https://constellation.microcosm.blue'
const SLINGSHOT = 'https://slingshot.microcosm.blue'
const originalFetch = global.fetch

describe('hasDecorationEntitlement', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  function respond(body: unknown, status = 200) {
    fetchMock.mockResolvedValue({
      ok: status < 400,
      status,
      json: () => Promise.resolve(body),
    } as Response)
  }

  it('checks every configured list in one many-to-many request', async () => {
    respond({
      items: [
        {
          linkRecord: {
            did: 'did:plc:issuer',
            collection: 'app.bsky.graph.listitem',
            rkey: 'manual-tid',
          },
          otherSubject: TEST_LIST,
        },
      ],
    })

    await expect(
      hasDecorationEntitlement(SUBJECT, CONSTELLATION, [PROD_LIST, TEST_LIST]),
    ).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.origin).toBe(CONSTELLATION)
    expect(url.pathname).toBe('/xrpc/blue.microcosm.links.getManyToMany')
    expect(url.searchParams.get('subject')).toBe(SUBJECT)
    expect(url.searchParams.get('source')).toBe(
      'app.bsky.graph.listitem:subject',
    )
    expect(url.searchParams.get('pathToOther')).toBe('list')
    expect(url.searchParams.getAll('otherSubject')).toEqual([
      PROD_LIST,
      TEST_LIST,
    ])
    expect(url.searchParams.getAll('did')).toEqual(['did:plc:issuer'])
  })

  it('rejects a match whose listitem is owned by someone else', async () => {
    respond({
      items: [
        {
          linkRecord: {
            did: 'did:plc:someone-else',
            collection: 'app.bsky.graph.listitem',
            rkey: 'spoofed',
          },
          otherSubject: PROD_LIST,
        },
      ],
    })

    await expect(
      hasDecorationEntitlement(SUBJECT, CONSTELLATION, [PROD_LIST]),
    ).resolves.toBe(false)
  })

  it('rejects a match for a different list uri', async () => {
    respond({
      items: [
        {
          linkRecord: {
            did: 'did:plc:issuer',
            collection: 'app.bsky.graph.listitem',
            rkey: 'other',
          },
          otherSubject: 'at://did:plc:issuer/app.bsky.graph.list/unrelated',
        },
      ],
    })

    await expect(
      hasDecorationEntitlement(SUBJECT, CONSTELLATION, [PROD_LIST]),
    ).resolves.toBe(false)
  })

  it('does not query when no configured uri is a usable list', async () => {
    await expect(
      hasDecorationEntitlement(SUBJECT, CONSTELLATION, [
        'at://did:plc:issuer/app.bsky.feed.post/1',
        'not-a-uri',
      ]),
    ).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

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
