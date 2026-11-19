/** Minimal unauthenticated AT Protocol reads for link-preview functions. */

function didWebUrl(did: string) {
  const parts = did.slice('did:web:'.length).split(':').map(decodeURIComponent)
  const host = parts.shift()
  return parts.length
    ? `https://${host}/${parts.join('/')}/did.json`
    : `https://${host}/.well-known/did.json`
}

export async function resolveIdentifier(
  name: string,
): Promise<{did: string; handle?: string}> {
  if (name.startsWith('did:')) return {did: name}
  const response = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(name)}`,
  )
  if (!response.ok) throw new Error('Account not found')
  const profile = (await response.json()) as {did: string; handle?: string}
  return {did: profile.did, handle: profile.handle}
}

export async function resolvePds(did: string) {
  const url = did.startsWith('did:web:')
    ? didWebUrl(did)
    : `https://plc.directory/${encodeURIComponent(did)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('DID document not found')
  const document = (await response.json()) as {
    service?: {id?: string; serviceEndpoint?: string}[]
  }
  const pds = document.service?.find(service =>
    service.id?.endsWith('#atproto_pds'),
  )?.serviceEndpoint
  if (!pds) throw new Error('PDS not found')
  return pds
}

export async function getRecord(
  pds: string,
  did: string,
  collection: string,
  rkey: string,
): Promise<{uri: string; cid: string; value: unknown}> {
  const url = new URL('/xrpc/com.atproto.repo.getRecord', pds)
  url.searchParams.set('repo', did)
  url.searchParams.set('collection', collection)
  url.searchParams.set('rkey', rkey)
  const response = await fetch(url)
  if (!response.ok) throw new Error('Record not found')
  return (await response.json()) as {uri: string; cid: string; value: unknown}
}

export async function countRecords(
  pds: string,
  did: string,
  collection: string,
  {max = 1000, where}: {max?: number; where?: (value: unknown) => boolean} = {},
) {
  let count = 0
  let cursor: string | undefined
  do {
    const url = new URL('/xrpc/com.atproto.repo.listRecords', pds)
    url.searchParams.set('repo', did)
    url.searchParams.set('collection', collection)
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)
    const response = await fetch(url)
    if (!response.ok) break
    const page = (await response.json()) as {
      records: {value: unknown}[]
      cursor?: string
    }
    for (const record of page.records) {
      if (!where || where(record.value)) count++
    }
    cursor = page.cursor
  } while (cursor && count < max)
  return count
}
