import {FALLBACK_APP_NAME, getAppName} from './app-name'

type AppNameModule = typeof import('./app-name')
type Assets = Parameters<typeof getAppName>[0]

/**
 * Reloads the module so the per-isolate cache starts empty. Jest module
 * registry reset cannot be expressed with a static import.
 */
async function load(): Promise<AppNameModule> {
  jest.resetModules()
  return import('./app-name')
}

function assetsReturning(body: unknown, ok = true): Assets {
  return {
    fetch: () =>
      Promise.resolve({
        ok,
        json: () => Promise.resolve(body),
      } as Response),
  }
}

describe('getAppName', () => {
  it('uses the name the web build published', async () => {
    const {getAppName} = await load()
    await expect(
      getAppName(assetsReturning({name: 'Skycat'}), 'https://example.test'),
    ).resolves.toBe('Skycat')
  })

  it('falls back when the build published no name', async () => {
    const {getAppName} = await load()
    await expect(
      getAppName(assetsReturning({}), 'https://example.test'),
    ).resolves.toBe(FALLBACK_APP_NAME)
  })

  it('falls back when the asset is missing', async () => {
    const {getAppName} = await load()
    await expect(
      getAppName(assetsReturning({}, false), 'https://example.test'),
    ).resolves.toBe(FALLBACK_APP_NAME)
  })

  it('falls back when no assets binding is available', async () => {
    const {getAppName} = await load()
    await expect(getAppName(undefined, 'https://example.test')).resolves.toBe(
      FALLBACK_APP_NAME,
    )
  })
})
