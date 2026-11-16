/**
 * Where decoration entitlement comes from.
 *
 * Access is membership in an exact Bluesky list. The list is owned by the
 * service that hands out decorations, so a plain `app.bsky.graph.listitem`
 * added through any client grants access. Override the list with
 * `EXPO_PUBLIC_DECO_LIST_URIS` (comma separated) to run a different one.
 *
 * The default matches tenna.party, whose decoration records we also read, so
 * an account decorated there renders here without any extra setup.
 */
const DEFAULT_DECORATION_LIST_URIS = [
  'at://did:web:vessel.darkworld.download/app.bsky.graph.list/3msl7flumz422',
]

function readListUris(): string[] {
  const override: string | undefined =
    process.env.EXPO_PUBLIC_DECO_LIST_URIS
  if (!override) return DEFAULT_DECORATION_LIST_URIS
  return override
    .split(',')
    .map((uri: string) => uri.trim())
    .filter(Boolean)
}

/** Exact list URIs whose members may render decorations. */
export const DECORATION_LIST_URIS: readonly string[] = readListUris()

/** False when no list is configured, which disables every decoration query. */
export const DECORATIONS_ENABLED = DECORATION_LIST_URIS.length > 0
