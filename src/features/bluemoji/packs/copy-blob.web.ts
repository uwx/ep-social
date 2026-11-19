import {type Client} from '@atproto/lex'

import {uploadBlob} from '#/lib/api'

/**
 * Copies a blob from another PDS into the signed-in account by downloading it
 * and uploading it again. Blobs cannot be referenced across repos, so this is
 * the only way to keep an emoji after its source account deletes it.
 */
export async function copyBlobToOwnRepo(
  client: Client,
  url: string,
  mimeType?: string,
) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Blob download failed: ${response.status}`)
  }
  const blob = await response.blob()
  if (!blob.size) throw new Error('Blob download was empty')
  const encoding = mimeType ?? blob.type ?? 'application/octet-stream'
  return (await uploadBlob(client, blob, encoding)).blob
}
