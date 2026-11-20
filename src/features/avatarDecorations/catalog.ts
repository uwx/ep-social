import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

/**
 * Curated avatar decoration frames.
 *
 * A settings record names a frame by id. Unknown ids are ignored, so frames
 * added in newer builds degrade gracefully in older ones and junk in a record
 * can never render anything we don't ship.
 *
 * Frames are code-drawn rings. Image-based frames can extend this type later
 * without touching the read path.
 */
export type DecorationFrame = {
  id: string
  /** Picker label. */
  name: MessageDescriptor
  /** Ring stroke color. */
  color: string
}

export const DECORATION_FRAMES: DecorationFrame[] = [
  {id: 'gold-ring', name: msg`Gold`, color: '#FFD700'},
  {id: 'flame-ring', name: msg`Flame`, color: '#F2571F'},
  {id: 'ocean-ring', name: msg`Ocean`, color: '#28ACDC'},
]

export function getFrame(id: string | undefined): DecorationFrame | undefined {
  if (!id) return undefined
  return DECORATION_FRAMES.find(frame => frame.id === id)
}

/**
 * Label for a ring whose color came from the record instead of a curated
 * frame. Never shown in the picker: a record that names only a color still
 * gets a ring, so custom colors work without picking a preset first.
 */
const CUSTOM_FRAME_NAME = msg({
  message: 'Custom color',
  comment: 'Avatar frame whose color was chosen by the account owner.',
})

/**
 * The frame to draw for a record: the curated frame with its color replaced,
 * a plain ring when only a color was named, or nothing.
 */
export function resolveFrame(
  id: string | undefined,
  color: string | undefined,
): DecorationFrame | undefined {
  const frame = getFrame(id)
  if (frame) return color ? {...frame, color} : frame
  if (color) return {id: 'custom-ring', name: CUSTOM_FRAME_NAME, color}
  return undefined
}
