/**
 * Google Fonts served from fonts.gstatic.com, on demand.
 *
 * Names can use any of ~1800 families, so no font file is bundled: the catalog
 * (`googleFonts.ts`) ships family names, and the face is fetched the first time
 * a name actually renders with it. Faces register under an `nf_` alias so a
 * family that also exists on the device (Roboto on Android, for one) can never
 * shadow the real face or lose to it.
 *
 * Two aliases exist per family:
 * - `nf_<family>` - the whole face, used to paint a name.
 * - `nf_<family>__preview` - a subset covering just the family's own name,
 *   used by the picker. A picker scroll would otherwise pull hundreds of
 *   kilobytes per row; the subset is a few KB.
 *
 * The platform caches the download (browser font cache, Expo asset cache), and
 * this module keeps a status map so a family is requested once per session no
 * matter how many rows need it.
 */

import {useEffect, useSyncExternalStore} from 'react'

import {fontCssUrl} from './fontCss'
import {hasGoogleFont} from './googleFonts'
import {registerFontFamily} from './nameFontLoader'

export type NameFontState = 'loading' | 'loaded' | 'error'

/** Faces load off the render path, but never more than this at once. */
const MAX_CONCURRENT = 3

const states = new Map<string, NameFontState>()
const queue: {alias: string; url: string; text?: string}[] = []
const listeners = new Set<() => void>()
let active = 0

/** Family names are the record's value; aliases are what styles reference. */
export function nameFontAlias(family: string): string {
  return `nf_${family.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
}

function previewAlias(family: string): string {
  return `${nameFontAlias(family)}__preview`
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const {alias, url, text} = queue.shift()!
    active++
    registerFontFamily(alias, url, text)
      .then(() => states.set(alias, 'loaded'))
      .catch(() => states.set(alias, 'error'))
      .finally(() => {
        active--
        emit()
        pump()
      })
  }
}

function request(alias: string, family: string, text?: string) {
  if (states.has(alias)) return
  states.set(alias, 'loading')
  queue.push({alias, url: fontCssUrl(family, text), text})
  pump()
}

/**
 * Starts loading the whole face for `family`, unless it is unknown to this
 * build or already requested. Safe to call from every render.
 */
export function ensureNameFont(family: string | undefined) {
  if (!family || !hasGoogleFont(family)) return
  request(nameFontAlias(family), family)
}

/** Starts loading the picker subset (the family name's own glyphs). */
export function ensureNameFontPreview(family: string | undefined) {
  if (!family || !hasGoogleFont(family)) return
  request(previewAlias(family), family, family)
}

/** Current load state by alias, for tests. */
export function getNameFontState(alias: string | undefined) {
  return alias ? states.get(alias) : undefined
}

/** Resets the module cache. Tests only. */
export function resetNameFonts() {
  states.clear()
  queue.length = 0
  listeners.clear()
  active = 0
}

function useLoadedAlias(
  family: string | undefined,
  alias: (family: string) => string,
  ensure: (family: string) => void,
) {
  const value = useSyncExternalStore(
    subscribe,
    () => (family ? states.get(alias(family)) : undefined),
    () => undefined,
  )
  useEffect(() => {
    if (family) ensure(family)
  }, [family, ensure])
  return value === 'loaded' && family ? alias(family) : undefined
}

/**
 * The `fontFamily` to put on a style for `family`, or undefined until the face
 * has loaded (and forever, for a family this build does not ship). Returning
 * undefined keeps a name in the app font until its own face is ready, so text
 * never renders in a fallback the author did not pick.
 */
export function useNameFontAlias(family: string | undefined): string | undefined {
  return useLoadedAlias(family, nameFontAlias, ensureNameFont)
}

/** Same, for the picker's subset face. */
export function useNameFontPreviewAlias(
  family: string | undefined,
): string | undefined {
  return useLoadedAlias(family, previewAlias, ensureNameFontPreview)
}
