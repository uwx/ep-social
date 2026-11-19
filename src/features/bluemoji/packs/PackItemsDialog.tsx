import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {EmojiGrid} from '#/features/bluemoji/Picker'
import {type BluemojiItem} from '#/features/bluemoji/util'
import {useSetPackItemsMutation} from './mutations'
import {type BluemojiPack, type BluemojiPackItem} from './util'

/**
 * Adds and removes emoji in one pass. The grid is scoped to the pack owner's
 * collection; each selected emoji becomes a membership record pointing at it.
 */
export function PackItemsDialog({
  pack,
  memberships = [],
  onDone,
}: {
  pack: BluemojiPack
  memberships?: BluemojiPackItem[]
  onDone: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {mutate: save, isPending} = useSetPackItemsMutation()
  const members = new Set(memberships.map(item => item.subject))
  const [added, setAdded] = useState<Map<string, BluemojiItem>>(() => new Map())
  const [removed, setRemoved] = useState<Set<string>>(() => new Set())

  const selected = [
    ...memberships
      .filter(item => !removed.has(item.subject))
      .map(item => item.subject),
    ...added.keys(),
  ]

  const toggle = (item: BluemojiItem) => {
    if (added.has(item.uri)) {
      setAdded(previous => {
        const next = new Map(previous)
        next.delete(item.uri)
        return next
      })
      return
    }
    if (members.has(item.uri)) {
      setRemoved(previous => {
        const next = new Set(previous)
        if (next.has(item.uri)) next.delete(item.uri)
        else next.add(item.uri)
        return next
      })
      return
    }
    setAdded(previous => new Map(previous).set(item.uri, item))
  }

  return (
    <Dialog.ScrollableInner label={l`Pack emoji`}>
      <View style={[a.gap_md, a.pb_lg]}>
        <Text style={[a.text_md, a.font_semi_bold]}>
          <Trans>Choose emoji for this pack</Trans>
        </Text>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Tap an emoji to add or remove it. Only emoji in your own collection
            can go in a pack.
          </Trans>
        </Text>

        <EmojiGrid repo={pack.did} chosen={selected} onSelect={toggle} />

        <Button
          color="primary"
          size="large"
          disabled={isPending}
          label={l`Save pack emoji`}
          onPress={() => {
            save(
              {
                pack,
                add: [...added.values()],
                remove: memberships.filter(item => removed.has(item.subject)),
              },
              {onSuccess: onDone},
            )
          }}>
          <ButtonText>
            {isPending ? <Trans>Saving…</Trans> : <Trans>Save</Trans>}
          </ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
