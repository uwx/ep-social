import {
  getRecord,
  resolveIdentifier,
  resolvePds,
} from '../_shared/atproto.ts'

export type ThemeRecord = {
  name: string
  description?: string
  mode?: 'light' | 'dark'
  recommendedPair?: string
  base: {name: string; colors: Record<string, string>}
  variants?: {name: string; colors?: Record<string, string>}[]
  special?: {$type: string; accent?: string}
}

export async function resolveTheme(name: string, rkey: string) {
  const {did, handle} = await resolveIdentifier(name)
  const pds = await resolvePds(did)
  const result = await getRecord(pds, did, 'app.witchsky.theme.colors', rkey)
  return {
    ...(result as {uri: string; cid: string; value: ThemeRecord}),
    author: handle ?? name,
    did,
  }
}

export function themeColorSets(record: ThemeRecord) {
  return [
    record.base,
    ...(record.variants ?? []).map(variant => ({
      name: variant.name,
      colors: {...record.base.colors, ...variant.colors},
    })),
  ]
}

export {escapeHtml} from '../_shared/escape'
