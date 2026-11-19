import {ExpoOAuthClient} from '@atproto/oauth-client-expo'

import {createIdentityResolver} from './identity-resolver'
import {
  createOAuthMetadata,
  DEFAULT_NATIVE_OAUTH_BASE_URL,
  LEGACY_NATIVE_REDIRECT_SCHEMES,
  nativeRedirectScheme,
  nativeRedirectUri,
} from './oauth-config'
import {getOAuthAudiences} from './oauth-scopes'

export const NATIVE_OAUTH_BASE_URL =
  process.env.EXPO_PUBLIC_OAUTH_NATIVE_BASE_URL || DEFAULT_NATIVE_OAUTH_BASE_URL
export const NATIVE_REDIRECT_URI = nativeRedirectUri(NATIVE_OAUTH_BASE_URL)
/** Current scheme first, then schemes from earlier builds. */
export const NATIVE_REDIRECT_SCHEMES = [
  nativeRedirectScheme(NATIVE_OAUTH_BASE_URL),
  ...LEGACY_NATIVE_REDIRECT_SCHEMES,
]

const clients = new Map<string, ExpoOAuthClient>()

export function getNativeOAuthClient(
  audiences: {appview: string; chat: string} = getOAuthAudiences(),
) {
  const metadata = createOAuthMetadata({
    baseUrl: NATIVE_OAUTH_BASE_URL,
    clientName: process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'Purrsky',
    native: true,
    ...audiences,
  })
  let client = clients.get(metadata.client_id)
  if (!client) {
    client = new ExpoOAuthClient({
      clientMetadata: metadata,
      identityResolver: createIdentityResolver(),
    })
    clients.set(metadata.client_id, client)
  }
  return client
}
