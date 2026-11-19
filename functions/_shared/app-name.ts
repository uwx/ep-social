interface AssetFetcher {
  fetch(request: Request | string): Promise<Response>
}

/**
 * The name used when the deployed assets do not carry `/app-name.json`, e.g.
 * when running the functions locally without a web build.
 */
export const FALLBACK_APP_NAME = 'Purrsky'

let cached: string | undefined

/**
 * The display name this deployment was built with.
 *
 * `pnpm build-web` writes `/app-name.json` from `EXPO_PUBLIC_APP_NAME`, the
 * same value that is inlined into the bundle, so server-rendered metadata and
 * the app can never disagree. Cached per isolate; a deploy gets fresh ones.
 */
export async function getAppName(
  assets: AssetFetcher | undefined,
  origin: string,
): Promise<string> {
  if (cached) return cached
  if (!assets) return FALLBACK_APP_NAME

  try {
    const response = await assets.fetch(
      new URL('/app-name.json', origin).toString(),
    )
    if (response.ok) {
      const data = (await response.json()) as {name?: unknown}
      if (typeof data.name === 'string' && data.name.trim()) {
        cached = data.name.trim()
        return cached
      }
    }
  } catch {}

  return FALLBACK_APP_NAME
}
