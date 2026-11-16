import {type ComAtprotoLabelDefs} from '@atproto/api'

/**
 * How the person relates to the character, from least to most specific.
 * `badge` means they only want the picture, with no kin claim.
 */
export const KIN_TYPES = [
  'badge',
  's',
  'fictive',
  'fictionkin',
  'otherkin',
] as const

export type KinType = (typeof KIN_TYPES)[number]

/** Characters that have a badge, in picker order. */
export const KIN_CHARACTERS = ['kris', 'susie', 'ralsei', 'noelle'] as const

export type KinCharacter = (typeof KIN_CHARACTERS)[number]

/** Character names as shown in the picker and the dialog. */
export const KIN_CHARACTER_NAMES: Record<KinCharacter, string> = {
  kris: 'Kris',
  susie: 'Susie',
  ralsei: 'Ralsei',
  noelle: 'Noelle',
}

export type DeltaLabel = {
  character: KinCharacter
  kin: KinType
}

/**
 * Self-labels are written as `dr-<character>-<kin>`, the scheme tenna.party
 * uses, so an account labelled there shows the same badge here.
 */
const DELTA_LABEL_RE = /^dr-([a-z]+)-(badge|s|fictive|fictionkin|otherkin)$/

/** The self-label value for a choice. */
export function deltaLabelValue(character: KinCharacter, kin: KinType): string {
  return `dr-${character}-${kin}`
}

function isKinCharacter(value: string): value is KinCharacter {
  return (KIN_CHARACTERS as readonly string[]).includes(value)
}

export function parseDeltaLabel(value: string): DeltaLabel | undefined {
  const match = DELTA_LABEL_RE.exec(value)
  if (!match) return undefined
  const [, character, kin] = match
  if (!isKinCharacter(character)) return undefined
  return {character, kin: kin as KinType}
}

/** True for any of this account's fictionkin self-labels. */
export function isDeltaLabelValue(value: string): boolean {
  return value.startsWith('dr-')
}

/**
 * The account's own fictionkin label, if it has one.
 *
 * Only self-labels count: a label applied by someone else is not a claim the
 * person made about themselves, so it must not render as a badge.
 */
export function getDeltaLabel(profile: {
  did: string
  labels?: ComAtprotoLabelDefs.Label[]
}): DeltaLabel | undefined {
  for (const label of profile.labels ?? []) {
    if (label.src !== profile.did) continue
    const parsed = parseDeltaLabel(label.val)
    if (parsed) return parsed
  }
  return undefined
}

export function isFictionkinAccount(profile: {
  did: string
  labels?: ComAtprotoLabelDefs.Label[]
}): boolean {
  return getDeltaLabel(profile) !== undefined
}
