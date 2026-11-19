import {useCallback, useImperativeHandle, useState} from 'react'
import {
  type ListRenderItemInfo,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List, type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {EmojiHeartEyes_Stroke2_Corner0_Rounded as BluemojiIcon} from '#/components/icons/Emoji'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {PackCard} from './PackCard'
import {usePacksQuery} from './queries'
import {type BluemojiPack} from './util'

interface SectionRef {
  scrollToTop: () => void
}

function keyExtractor(item: BluemojiPack) {
  return item.uri
}

/**
 * The profile's Emoji packs tab. Packs live on the owner's PDS with no AppView
 * index, so this is a direct read rather than a paginated AppView query.
 */
export function ProfilePacks({
  ref,
  scrollElRef,
  did,
  name,
  headerOffset,
  enabled,
  style,
  testID,
  isMe,
}: {
  ref?: React.Ref<SectionRef>
  scrollElRef: ListRef
  did: string
  /** Profile identifier the pack links resolve through, usually a handle. */
  name: string
  headerOffset: number
  enabled: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  isMe: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const bottomBarOffset = useBottomBarOffset(100)
  const {height} = useWindowDimensions()
  const [isPTRing, setIsPTRing] = useState(false)
  const {data, refetch, isError} = usePacksQuery({did, enabled})

  const items = data?.packs ?? []
  const counts = data?.counts ?? {}

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {},
  }))

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh Bluemoji packs', {message: err})
    }
    setIsPTRing(false)
  }, [refetch])

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<BluemojiPack>) => (
      <View style={[a.px_md, index === 0 ? a.pt_lg : a.pt_sm]}>
        <PackCard pack={item} count={counts[item.uri] ?? 0} name={name} />
      </View>
    ),
    [counts, name],
  )

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        headerOffset={headerOffset}
        contentContainerStyle={{
          minHeight: height + headerOffset,
          paddingBottom: bottomBarOffset,
        }}
        removeClippedSubviews={true}
        desktopFixedHeight
        onRefresh={() => void onRefresh()}
        ListEmptyComponent={
          data ? (
            isError ? (
              <View style={[a.px_lg, a.py_lg]}>
                <Text style={[t.atoms.text_contrast_medium]}>
                  <Trans>Could not load emoji packs.</Trans>
                </Text>
              </View>
            ) : (
              <View style={[a.px_lg, a.align_center, a.justify_center]}>
                <EmptyState
                  icon={BluemojiIcon}
                  iconSize="3xl"
                  message={
                    isMe
                      ? l`Emoji packs let you share a set of custom emoji with your friends.`
                      : l`No emoji packs yet`
                  }
                  button={
                    isMe
                      ? {
                          label: l`Create a pack`,
                          text: l`Create a pack`,
                          color: 'primary',
                          size: 'small',
                          onPress: () =>
                            navigation.navigate('CustomEmojiSettings'),
                        }
                      : undefined
                  }
                />
              </View>
            )
          ) : (
            <View style={[a.py_5xl, a.align_center]}>
              <Loader size="lg" />
            </View>
          )
        }
        ListFooterComponent={isMe ? <ManageCustomEmoji /> : undefined}
      />
    </View>
  )
}

/**
 * Shortcut to the Custom emoji screen, which is where emoji and packs are made.
 * Without it the screen is only reachable from settings.
 */
function ManageCustomEmoji() {
  const {t: l} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  return (
    <View
      style={[
        a.px_lg,
        a.pt_lg,
        a.pb_md,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <Button
        label={l`Manage custom emoji and packs`}
        color="secondary"
        size="small"
        onPress={() => navigation.navigate('CustomEmojiSettings')}>
        <ButtonText>
          <Trans>Custom emoji and packs</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
