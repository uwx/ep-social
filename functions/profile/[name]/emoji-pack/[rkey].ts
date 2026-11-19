import {getAppName} from '../../../_shared/app-name.ts'
import {
  countRecords,
  getRecord,
  resolveIdentifier,
  resolvePds,
} from '../../../_shared/atproto.ts'
import {escapeHtml} from '../../../_shared/escape.ts'

type Env = {ASSETS?: Fetcher}

type PackRecord = {
  name?: string
  description?: string
  icon?: {$type?: string; ref?: {$link?: string}; mimeType?: string}
}

export const onRequestGet: PagesFunction<Env> = async context => {
  try {
    const name = String(context.params.name)
    const rkey = String(context.params.rkey)
    const {did, handle} = await resolveIdentifier(name)
    const pds = await resolvePds(did)
    const result = await getRecord(pds, did, 'blue.moji.packs.pack', rkey)
    const pack = result.value as PackRecord
    if (!pack?.name) throw new Error('Invalid pack')

    const count = await countRecords(pds, did, 'blue.moji.packs.packitem', {
      where: value =>
        Boolean(value) &&
        typeof value === 'object' &&
        'pack' in value &&
        (value as {pack?: unknown}).pack === result.uri,
    })
    const author = handle ?? name
    const subtitle = `${count} emoji · @${author}`
    const description = pack.description ?? subtitle
    const iconCid = pack.icon?.ref?.$link
    const url = new URL(context.request.url)
    const appName = await getAppName(context.env.ASSETS, url.origin)
    const image = iconCid
      ? `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(iconCid)}`
      : undefined
    const meta = `
      <title>${escapeHtml(pack.name)} — ${escapeHtml(appName)}</title>
      <meta name="description" content="${escapeHtml(description)}">
      <meta property="og:site_name" content="${escapeHtml(appName)}">
      <meta property="og:type" content="website">
      <meta property="og:title" content="${escapeHtml(pack.name)}">
      <meta property="og:description" content="${escapeHtml(description)}">
      ${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
      <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`
    const response = await context.next()
    if (!response.ok) return response

    const html = (await response.text()).replace('</head>', `${meta}</head>`)
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'content-type': 'text/html; charset=utf-8',
      },
    })
  } catch {
    return context.next()
  }
}
