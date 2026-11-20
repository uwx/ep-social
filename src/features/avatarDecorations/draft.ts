import {type AvatarShape} from './avatarShapes'
import {normalizeHex} from './oklch'
import {type DecorationSettings, type NameGradientPaint} from './records'

/**
 * Editable copy of the saved decorations. Nothing is written until Save, and
 * until the user touches something the draft simply mirrors the record so a
 * late-arriving read still shows up.
 */
export type DecorationDraft = {
  touched: boolean
  avatar?: string
  avatarShape?: AvatarShape
  name?: string
  nameOutline: boolean
  avatarColor?: string
  nameColor?: string
  nameGradient?: NameGradientPaint
  nameFont?: string
}

export function draftFromSaved(saved: DecorationSettings): DecorationDraft {
  return {
    touched: false,
    avatar: saved.avatar,
    avatarShape: saved.avatarShape,
    name: saved.name,
    nameOutline: !!saved.nameOutline,
    avatarColor: saved.avatarColor,
    nameColor: saved.nameColor,
    nameGradient: saved.nameGradient,
    nameFont: saved.nameFont,
  }
}

/** The draft the screen should render: local edits win once touched. */
export function resolveDraft(
  draft: DecorationDraft,
  saved: DecorationSettings,
): DecorationDraft {
  return draft.touched ? draft : draftFromSaved(saved)
}

/**
 * Applies one edit. Choosing a slot captures the resolved values first, so the
 * untouched slots keep showing the saved record instead of resetting.
 *
 * Colors are normalized on the way in: the record layer lowercases every hex it
 * reads or writes, so an edit that kept the typed casing would compare unequal
 * to the saved record and leave the screen permanently dirty after a save.
 */
export function applyDraftEdit(
  draft: DecorationDraft,
  saved: DecorationSettings,
  patch: Partial<Omit<DecorationDraft, 'touched'>>,
): DecorationDraft {
  const next: DecorationDraft = {
    ...resolveDraft(draft, saved),
    ...patch,
    touched: true,
  }
  if ('avatarColor' in patch) {
    next.avatarColor = normalizeHex(patch.avatarColor) ?? undefined
  }
  if ('nameColor' in patch) {
    next.nameColor = normalizeHex(patch.nameColor) ?? undefined
  }
  if ('nameGradient' in patch) {
    const colors = patch.nameGradient?.colors
    next.nameGradient = colors
      ? {
          ...patch.nameGradient,
          colors: colors.map(color => normalizeHex(color) ?? color),
        }
      : undefined
  }
  return next
}

/** Gradient paints are rebuilt on every slider move, so compare by value. */
function sameGradient(
  a: NameGradientPaint | undefined,
  b: NameGradientPaint | undefined,
) {
  if (a === b) return true
  if (!a || !b) return false
  return (
    !!a.hard === !!b.hard &&
    a.colors.length === b.colors.length &&
    a.colors.every((color, index) => color === b.colors[index])
  )
}

/** Whether the draft differs from the stored record in any slot. */
export function isDraftDirty(
  draft: DecorationDraft,
  saved: DecorationSettings,
): boolean {
  const resolved = resolveDraft(draft, saved)
  return (
    resolved.touched &&
    (resolved.avatar !== saved.avatar ||
      resolved.avatarShape !== saved.avatarShape ||
      resolved.name !== saved.name ||
      resolved.nameOutline !== !!saved.nameOutline ||
      resolved.avatarColor !== saved.avatarColor ||
      resolved.nameColor !== saved.nameColor ||
      resolved.nameFont !== saved.nameFont ||
      !sameGradient(resolved.nameGradient, saved.nameGradient))
  )
}

/** The patch to write for the resolved draft; undefined clears a slot. */
export function draftToPatch(
  draft: DecorationDraft,
  saved: DecorationSettings,
): DecorationSettings {
  const resolved = resolveDraft(draft, saved)
  return {
    avatar: resolved.avatar,
    avatarShape: resolved.avatarShape,
    name: resolved.name,
    nameOutline: resolved.nameOutline,
    avatarColor: resolved.avatarColor,
    nameColor: resolved.nameColor,
    nameGradient: resolved.nameGradient,
    nameFont: resolved.nameFont,
  }
}
