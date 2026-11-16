import {type $Typed} from '@atproto/lex'

import {com} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {deltaLabelValue, isDeltaLabelValue} from './fictionkinLabels'

type SelfLabels = $Typed<com.atproto.label.defs.SelfLabels>

/** The self-labels on a record, or a fresh empty set when it has none. */
export function readSelfLabels(existing: {labels?: unknown}): SelfLabels {
  if (bsky.matches(com.atproto.label.defs.selfLabels, existing.labels)) {
    return {
      $type: 'com.atproto.label.defs#selfLabels',
      values: existing.labels.values,
    }
  }
  return {$type: 'com.atproto.label.defs#selfLabels', values: []}
}

/**
 * Replaces the record's fictionkin labels with `choice`, leaving every other
 * self-label alone.
 *
 * This is a pure function because the destructive part matters: putRecord
 * replaces the whole record, and the same label array also holds the pet, bot,
 * and pvp labels, so a too-broad filter would silently drop them. Passing
 * `undefined` removes the badge.
 */
export function applyFictionkinLabel(
  existing: {labels?: unknown},
  choice: {character: string; kin: string} | undefined,
): {labels?: SelfLabels} {
  const labels = readSelfLabels(existing)
  // A person may hold one character badge, so every `dr-` label goes.
  const others = labels.values.filter(label => !isDeltaLabelValue(label.val))
  const values = choice
    ? [
        ...others,
        {val: deltaLabelValue(choice.character as never, choice.kin as never)},
      ]
    : others

  if (values.length === 0) return {}
  return {labels: {...labels, values}}
}
