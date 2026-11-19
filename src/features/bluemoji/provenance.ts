/**
 * Provenance fields are self-asserted by the record's owner. These helpers only
 * decide how to render them safely: a source is a link only if it is a plain
 * http(s) URL, and a licence links only to a canonical SPDX page.
 */

/** Only `http(s)` sources without credentials become links. */
export function getSafeSourceUrl(source: string | null | undefined) {
  const raw = source?.trim()
  if (!raw || /\s/.test(raw)) return undefined
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    if (url.username || url.password) return undefined
    return url.href
  } catch {
    return undefined
  }
}

/**
 * SPDX identifiers link to their canonical page; `LicenseRef-*` and malformed
 * expressions are shown as plain text. Mirrors the AppView's own validation.
 */
export function getLicenseUrl(license: string | null | undefined) {
  const id = license?.trim()
  if (!id || !/^[A-Za-z0-9.-]+$/.test(id) || id.startsWith('LicenseRef-')) {
    return undefined
  }
  return `https://spdx.org/licenses/${id}.html`
}
