import * as Linking from 'expo-linking'
import {openAuthSessionAsync} from 'expo-web-browser'
import {type OAuthSession} from '@atproto/oauth-client-expo'

import {isNativeRedirectUrl} from './oauth-config'
import {
  getNativeOAuthClient,
  NATIVE_REDIRECT_SCHEMES,
  NATIVE_REDIRECT_URI,
} from './oauth-native-client'
import {getOAuthScope} from './oauth-scopes'

type SignInOptions = {
  signal?: AbortSignal
  scope?: string
  audiences?: {appview: string; chat: string}
}

// Android may deliver one or two slashes after the custom URI scheme, and
// builds before the puppykitty move used a different scheme.
const OAUTH_CALLBACK_SCHEMES = new Set(NATIVE_REDIRECT_SCHEMES)

/**
 * Complete Android OAuth from the redirect deep link itself.
 *
 * Expo's Android auth-session implementation races the redirect against an
 * AppState-based browser result. The browser result can settle (or its cleanup
 * can throw) while a valid redirect is being delivered, which makes
 * `ExpoOAuthClient.signIn()` reject after the user has authenticated. Treating
 * the redirect as the source of truth avoids that race while still opening a
 * system Custom Tab, so browser password managers remain available.
 */
export async function signInNative(
  identifier: string,
  {signal, scope = getOAuthScope(), audiences}: SignInOptions = {},
): Promise<OAuthSession> {
  const client = getNativeOAuthClient(audiences)
  let authorizationUrl: URL
  try {
    authorizationUrl = await client.authorize(identifier, {
      display: 'touch',
      scope,
      redirect_uri: NATIVE_REDIRECT_URI,
    })
  } catch (error) {
    if (signal?.aborted) throw new Error('OAUTH_CANCELLED')
    throw error
  }

  return new Promise((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      subscription.remove()
      signal?.removeEventListener('abort', onAbort)
    }

    const rejectOnce = (error: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error instanceof Error ? error : new Error(String(error)))
    }

    const onAbort = () => rejectOnce(new Error('OAUTH_CANCELLED'))

    const subscription = Linking.addEventListener(
      'url',
      ({url: callbackUrl}) => {
        if (
          settled ||
          !isNativeRedirectUrl(callbackUrl, OAUTH_CALLBACK_SCHEMES)
        )
          return
        settled = true
        cleanup()

        void (async () => {
          const queryStart = callbackUrl.indexOf('?')
          const query =
            queryStart === -1 ? '' : callbackUrl.slice(queryStart + 1)
          const params = new URLSearchParams(query)
          const {session} = await client.callback(params, {
            redirect_uri: NATIVE_REDIRECT_URI,
          })
          resolve(session)
        })().catch(reject)
      },
    )

    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort)
    }

    // Ignore Android's unreliable resolved browser result. A launch rejection
    // is still fatal because no redirect can arrive when the tab never opened.
    void openAuthSessionAsync(
      authorizationUrl.toString(),
      NATIVE_REDIRECT_URI,
      {showInRecents: true},
    ).catch(rejectOnce)
  })
}
