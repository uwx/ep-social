jest.mock('expo-font', () => ({loadAsync: jest.fn()}))

import {loadAsync} from 'expo-font'

import {registerFontFamily} from './nameFontLoader'

const load = loadAsync as jest.MockedFunction<typeof loadAsync>
const originalFetch = global.fetch

const CSS = `/* latin */
@font-face {
  font-family: 'Pacifico';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/pacifico/v23/FwZY7-Qmy14u9lezJ96A.ttf) format('truetype');
}`

function mockFetch(body: string, ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    text: () => Promise.resolve(body),
  })
  global.fetch = fetchMock
  return fetchMock
}

beforeEach(() => {
  load.mockReset()
  load.mockResolvedValue(undefined)
})

afterEach(() => {
  global.fetch = originalFetch
})

it('asks Google for a single ttf and registers it under the alias', async () => {
  const fetchMock = mockFetch(CSS)

  await registerFontFamily(
    'nf_pacifico',
    'https://fonts.googleapis.com/css2?family=Pacifico',
  )

  // A non-browser UA is what makes css2 answer with one `format('truetype')`
  // face instead of per-unicode-range woff2 files.
  expect(fetchMock).toHaveBeenCalledWith(
    'https://fonts.googleapis.com/css2?family=Pacifico',
    expect.objectContaining({
      headers: expect.objectContaining({'user-agent': 'okhttp/4.12.0'}),
    }),
  )
  expect(load).toHaveBeenCalledWith(
    'nf_pacifico',
    'https://fonts.gstatic.com/s/pacifico/v23/FwZY7-Qmy14u9lezJ96A.ttf',
  )
})

it('rejects a response with no face so the caller can mark an error', async () => {
  mockFetch('/* nothing */')

  await expect(
    registerFontFamily('nf_pacifico', 'https://fonts.googleapis.com/css2?x'),
  ).rejects.toThrow('no face')
  expect(load).not.toHaveBeenCalled()
})

it('rejects a failed css request without touching the font cache', async () => {
  mockFetch('', false)

  await expect(
    registerFontFamily('nf_pacifico', 'https://fonts.googleapis.com/css2?x'),
  ).rejects.toThrow('500')
  expect(load).not.toHaveBeenCalled()
})
