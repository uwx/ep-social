import {
  applyDraftEdit,
  draftFromSaved,
  draftToPatch,
  isDraftDirty,
  resolveDraft,
} from './draft'

const saved = {
  avatar: 'gold-ring',
  avatarShape: 'circle' as const,
  name: 'rose',
  nameOutline: true,
}

it('mirrors the saved record until the user edits something', () => {
  const draft = draftFromSaved({})
  expect(resolveDraft(draft, saved)).toMatchObject({
    avatar: 'gold-ring',
    avatarShape: 'circle',
    name: 'rose',
    nameOutline: true,
  })
})

it('keeps the untouched slots when one slot changes', () => {
  const draft = applyDraftEdit(draftFromSaved({}), saved, {name: 'ocean'})
  expect(draft).toEqual({
    touched: true,
    avatar: 'gold-ring',
    avatarShape: 'circle',
    name: 'ocean',
    nameOutline: true,
  })
})

it('is not dirty before any edit, even when the record arrives later', () => {
  expect(isDraftDirty(draftFromSaved({}), saved)).toBe(false)
})

it('is dirty once a slot differs from the record', () => {
  const draft = applyDraftEdit(draftFromSaved(saved), saved, {name: 'ocean'})
  expect(isDraftDirty(draft, saved)).toBe(true)
})

it('is not dirty when an edit lands back on the saved value', () => {
  const draft = applyDraftEdit(
    applyDraftEdit(draftFromSaved(saved), saved, {name: 'ocean'}),
    saved,
    {name: 'rose'},
  )
  expect(isDraftDirty(draft, saved)).toBe(false)
})

it('clears a slot by leaving it undefined in the patch', () => {
  const draft = applyDraftEdit(draftFromSaved(saved), saved, {
    avatar: undefined,
    name: undefined,
  })
  const patch = draftToPatch(draft, saved)
  expect(patch.avatar).toBeUndefined()
  expect(patch.name).toBeUndefined()
  expect(patch.avatarShape).toBe('circle')
})

it('still follows the record after an untouched edit of another slot', () => {
  // The read lands after the draft was created but before any edit.
  const draft = applyDraftEdit(draftFromSaved({}), {}, {avatarShape: 'hexagon'})
  expect(draft).toMatchObject({avatarShape: 'hexagon', name: undefined})
})

it('compares a gradient by value, so saving does not leave it dirty', () => {
  const withGradient = {nameGradient: {colors: ['#7c3aed', '#28acdc']}}
  const draft = applyDraftEdit(draftFromSaved(withGradient), withGradient, {
    nameGradient: {colors: ['#7c3aed', '#28acdc']},
  })

  expect(isDraftDirty(draft, withGradient)).toBe(false)
  expect(
    isDraftDirty(
      applyDraftEdit(draftFromSaved(withGradient), withGradient, {
        nameGradient: {colors: ['#7c3aed', '#28acdc'], hard: true},
      }),
      withGradient,
    ),
  ).toBe(true)
})

it('lowercases an edited color so a save does not leave the draft dirty', () => {
  const saved = {nameColor: '#00ff88'}
  const draft = applyDraftEdit(draftFromSaved({}), {}, {nameColor: '#00FF88'})

  // The record layer stores lowercase; a typed uppercase hex must land on the
  // same value or the screen would stay dirty after saving.
  expect(draft.nameColor).toBe('#00ff88')
  expect(isDraftDirty(draft, saved)).toBe(false)

  const gradient = applyDraftEdit(draftFromSaved({}), {}, {
    nameGradient: {colors: ['#00FF88', '#7C3AED']},
  })
  expect(gradient.nameGradient?.colors).toEqual(['#00ff88', '#7c3aed'])
})

it('clears a color the user emptied instead of storing junk', () => {
  const draft = applyDraftEdit(draftFromSaved({nameColor: '#00ff88'}), {}, {
    nameColor: '',
  })
  expect(draft.nameColor).toBeUndefined()
})
