/** Shared by clients, metadata generation, and the metadata HTTP handlers. */
export const DEFAULT_APPVIEW_AUDIENCE = 'did:web:api.bsky.app#bsky_appview'
export const DEFAULT_CHAT_AUDIENCE = 'did:web:api.bsky.chat#bsky_chat'

/** Origin hosting the web client metadata (`EXPO_PUBLIC_OAUTH_BASE_URL`). */
export const DEFAULT_OAUTH_BASE_URL = 'https://witchsky.app'
/**
 * Origin hosting the native client metadata. Native metadata has its own host
 * because atproto requires the private-use redirect scheme to be the
 * `client_id` hostname in reverse-domain order, which pins one host per scheme.
 */
export const DEFAULT_NATIVE_OAUTH_BASE_URL = 'https://app.puppykitty.racing'
export const OAUTH_CALLBACK_PATH = '/auth/callback'
/** Schemes shipped by earlier builds; they stay registered so old links open. */
export const LEGACY_NATIVE_REDIRECT_SCHEMES = ['app.witchsky'] as const

/**
 * RFC 8252 private-use scheme for a client_id: the hostname in reverse-domain
 * order. atproto's provider rejects native metadata whose redirect scheme is
 * not exactly this (see `reverseDomain` in atproto's oauth-provider).
 */
export function nativeRedirectScheme(baseUrl: string) {
  const {hostname} = new URL(baseUrl)
  const scheme = hostname.split('.').reverse().join('.')
  if (!scheme.includes('.')) {
    throw new Error(
      `Native OAuth requires a dotted client_id hostname, got "${hostname}"`,
    )
  }
  return scheme as `${string}.${string}`
}

/** atproto also requires a single slash after the scheme (RFC 8252). */
export function nativeRedirectUri(baseUrl: string) {
  const uri: `${string}.${string}:/${string}` = `${nativeRedirectScheme(baseUrl)}:${OAUTH_CALLBACK_PATH}`
  return uri
}

/**
 * True when a deep link is the OAuth redirect. Accepts the current scheme plus
 * schemes from earlier builds, and Android's one- or two-slash delivery.
 */
export function isNativeRedirectUrl(url: string, schemes: Iterable<string>) {
  const allowed = new Set(schemes)
  const match = /^([a-z0-9.+-]+):\/+([^?#]*)/i.exec(url)
  if (!match || !allowed.has(match[1].toLowerCase())) return false
  return `/${match[2]}` === OAUTH_CALLBACK_PATH
}

/** Keep the prod grant and client identity so stored sessions can refresh. */
export const OAUTH_SCOPE =
  'atproto transition:generic transition:email transition:chat.bsky'

export const OPTIONAL_OAUTH_SCOPES = {
  handle: 'identity:handle',
  email: 'account:email?action=manage',
} as const
export type OAuthPermission = keyof typeof OPTIONAL_OAUTH_SCOPES

/** Servers may normalize positional parameters or percent encoding. */
export function hasOAuthPermission(scope: string, permission: OAuthPermission) {
  const scopes = scope.split(' ')
  if (
    permission === 'email' &&
    scopes.includes('transition:generic') &&
    scopes.includes('transition:email')
  ) {
    return true
  }
  return scopes.some(value => {
    const [name, query] = value.split('?')
    const [resource, positional] = name.split(':')
    const params = new URLSearchParams(query)
    const attr =
      positional === undefined
        ? params.get('attr')
        : decodeURIComponent(positional)
    if (permission === 'handle')
      return resource === 'identity' && (attr === 'handle' || attr === '*')
    return (
      resource === 'account' &&
      attr === 'email' &&
      params.get('action') === 'manage'
    )
  })
}

/** PDS grants expand permission sets into their constituent RPC scopes. */
export function hasOAuthAppViewScope(scope: string, audience: string) {
  return scope.split(' ').some(value => {
    if (value === 'transition:generic') return true
    const [name, query] = value.split('?')
    const [resource, positional] = name.split(':')
    const params = new URLSearchParams(query)
    if (params.get('aud') !== audience && params.get('aud') !== '*') {
      return false
    }
    if (resource === 'include') {
      return positional === 'app.bsky.authFullApp'
    }
    const methods = positional
      ? [decodeURIComponent(positional)]
      : params.getAll('lxm')
    return (
      resource === 'rpc' &&
      (methods.includes('*') ||
        methods.includes('app.bsky.notification.listNotifications'))
    )
  })
}

/** Keep the production grant, adding explicit optional access only on request. */
export function buildOAuthScope(
  _appview = DEFAULT_APPVIEW_AUDIENCE,
  _chat = DEFAULT_CHAT_AUDIENCE,
  permissions: OAuthPermission[] = [],
) {
  // transition:generic excludes identity operations such as changing a handle.
  const optional = permissions
    .filter(permission => !hasOAuthPermission(OAUTH_SCOPE, permission))
    .map(permission => OPTIONAL_OAUTH_SCOPES[permission])
  return [OAUTH_SCOPE, ...new Set(optional)].join(' ')
}

export function createOAuthMetadata({
  baseUrl,
  clientName = 'Purrsky',
  native = false,
  appview = DEFAULT_APPVIEW_AUDIENCE,
  chat = DEFAULT_CHAT_AUDIENCE,
}: {
  baseUrl: string
  clientName?: string
  native?: boolean
  appview?: string
  chat?: string
}) {
  baseUrl = new URL(baseUrl).origin
  for (const audience of [appview, chat]) {
    if (
      !/^did:(plc:[a-z2-7]{24}|web:[A-Za-z0-9._:%-]+)#[A-Za-z0-9._-]+$/.test(
        audience,
      )
    ) {
      throw new Error('Invalid OAuth service audience')
    }
  }
  const clientId = new URL(
    native
      ? '/oauth-client-metadata-native.json'
      : '/oauth-client-metadata.json',
    baseUrl,
  )
  return {
    client_id: clientId.href,
    client_name: clientName,
    client_uri: baseUrl,
    redirect_uris: [
      native ? nativeRedirectUri(baseUrl) : `${baseUrl}/auth/web/callback`,
    ] as [string],
    scope: buildOAuthScope(appview, chat, ['handle', 'email']),
    token_endpoint_auth_method: 'none' as const,
    response_types: ['code'] as ['code'],
    grant_types: ['authorization_code', 'refresh_token'] as [
      'authorization_code',
      'refresh_token',
    ],
    application_type: native ? ('native' as const) : ('web' as const),
    dpop_bound_access_tokens: true as const,
  }
}

/** The browser SDK signals successful popup handoff with this control-flow error. */
export function isOAuthPopupComplete(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'LOGIN_CONTINUED_IN_PARENT_WINDOW'
  )
}
