import {AtUri} from '@atproto/syntax'

import {type AvatarShape,isAvatarShape} from './avatarShapes'

/**
 * Decoration access is membership in an exact configured Bluesky list. A
 * listitem links to both its list and its member, so Constellation's
 * getManyToMany endpoint verifies both links in one query without fetching the
 * record body. Ordinary list items added through any client work exactly like
 * ones created by a decoration service.
 */
export const SUBSCRIBER_LIST_COLLECTION = 'app.bsky.graph.list'
export const SUBSCRIBER_LIST_ITEM_COLLECTION = 'app.bsky.graph.listitem'
const LIST_ITEM_SUBJECT_SOURCE = `${SUBSCRIBER_LIST_ITEM_COLLECTION}:subject`
const LIST_ITEM_LIST_PATH = 'list'

/**
 * Cosmetic choices, a self-record in the owner's PDS, written directly by the
 * app with the user's session. One record holds every slot (avatar frame,
 * avatar shape, name gradient, ...); list membership gates all of them.
 * A lapsed subscription leaves the record dormant (no membership = nothing
 * renders) so the choices come back on resubscribe.
 */
export const SETTINGS_COLLECTION = 'social.mu.deco.settings'
export const SETTINGS_RKEY = 'self'

/** Resolved slot ids from a settings record; each maps to its own catalog. */
export type DecorationSettings = {
  /** Avatar frame id (catalog.ts). */
  avatar?: string
  /** Preferred shape for this profile picture (avatarShapes.ts). */
  avatarShape?: AvatarShape
  /** Display-name gradient id (nameGradients.ts). */
  name?: string
  /** Draw a dark edge around the gradient name so it pops on any background. */
  nameOutline?: boolean
}

type GetManyToManyResponse = {
  items?: {
    linkRecord: {did: string; collection: string; rkey: string}
    otherSubject: string
  }[]
  cursor?: string | null
}

/**
 * Whether `subjectDid` belongs to any exact configured subscriber list.
 *
 * `did` restricts the linking record to the list owner, while the many-to-many
 * join verifies BOTH links in the same listitem: `list` points to the exact
 * configured list URI and `subject` points to this profile DID. This supports
 * ordinary list items created by Bluesky clients and needs no body fetch.
 */
export async function hasDecorationEntitlement(
  subjectDid: string,
  constellationService: string,
  subscriberListUris: readonly string[],
): Promise<boolean> {
  const lists = new Map<string, string>()
  for (const configuredUri of subscriberListUris) {
    try {
      const parsed = new AtUri(configuredUri)
      if (
        parsed.collection === SUBSCRIBER_LIST_COLLECTION &&
        parsed.rkey &&
        parsed.host.startsWith('did:')
      ) {
        lists.set(parsed.toString(), parsed.host)
      }
    } catch {
      // A malformed configured URI cannot grant access.
    }
  }
  if (lists.size === 0) return false

  const url = new URL(
    '/xrpc/blue.microcosm.links.getManyToMany',
    constellationService,
  )
  url.searchParams.set('subject', subjectDid)
  url.searchParams.set('source', LIST_ITEM_SUBJECT_SOURCE)
  url.searchParams.set('pathToOther', LIST_ITEM_LIST_PATH)
  url.searchParams.set('limit', '100')
  for (const listUri of lists.keys()) {
    url.searchParams.append('otherSubject', listUri)
  }
  for (const ownerDid of new Set(lists.values())) {
    url.searchParams.append('did', ownerDid)
  }

  const res = await fetch(url.toString(), {
    headers: {accept: 'application/json'},
  })
  if (!res.ok) {
    throw new Error(`Constellation getManyToMany failed: ${res.status}`)
  }
  const json = (await res.json()) as GetManyToManyResponse
  return !!json.items?.some(
    item =>
      item.linkRecord.collection === SUBSCRIBER_LIST_ITEM_COLLECTION &&
      lists.get(item.otherSubject) === item.linkRecord.did,
  )
}

/**
 * Fetches the subject's decoration settings record. Goes through Slingshot
 * (microcosm's cached record fetcher) rather than the AppView: the AppView only
 * serves getRecord for collections it indexes (app.bsky.*), while Slingshot
 * resolves any DID to its PDS and edge-caches the record.
 */
export async function getDecorationSettings(
  did: string,
  slingshotService: string,
): Promise<DecorationSettings> {
  const url = new URL('/xrpc/com.atproto.repo.getRecord', slingshotService)
  url.searchParams.set('repo', did)
  url.searchParams.set('collection', SETTINGS_COLLECTION)
  url.searchParams.set('rkey', SETTINGS_RKEY)

  const res = await fetch(url.toString(), {
    headers: {accept: 'application/json'},
  })
  // RecordNotFound and friends: a granted account that never picked anything.
  if (res.status === 400 || res.status === 404) {
    const body = (await res.json().catch(() => ({}))) as {error?: unknown}
    if (body.error === 'RecordNotFound') return {}
  }
  if (!res.ok) {
    throw new Error(`Slingshot getRecord failed: ${res.status}`)
  }
  const json = (await res.json()) as {value?: unknown}
  return parseDecorationSettings(json.value)
}

/** Ignores malformed optional slots received from a public record. */
export function parseDecorationSettings(value: unknown): DecorationSettings {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  return {
    ...(typeof record.avatar === 'string' ? {avatar: record.avatar} : {}),
    ...(isAvatarShape(record.avatarShape)
      ? {avatarShape: record.avatarShape}
      : {}),
    ...(typeof record.name === 'string' ? {name: record.name} : {}),
    ...(record.nameOutline === true ? {nameOutline: true} : {}),
  }
}

/**
 * Builds the record to write for `patch` over `current`. putRecord replaces the
 * whole record, so every other slot has to be carried over explicitly, and a
 * slot cleared in `patch` must be omitted rather than written as undefined.
 */
export function buildDecorationRecord(
  current: DecorationSettings,
  patch: Partial<DecorationSettings>,
): DecorationSettings & {$type: string; updatedAt: string} {
  const next: DecorationSettings = {...current, ...patch}
  return {
    $type: SETTINGS_COLLECTION,
    updatedAt: new Date().toISOString(),
    ...(next.avatar ? {avatar: next.avatar} : {}),
    ...(next.avatarShape ? {avatarShape: next.avatarShape} : {}),
    ...(next.name ? {name: next.name} : {}),
    // The outline only means anything alongside a gradient.
    ...(next.name && next.nameOutline ? {nameOutline: true} : {}),
  }
}
