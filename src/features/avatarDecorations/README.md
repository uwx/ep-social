# Profile decorations

Avatar frames, avatar shapes, and display-name gradients. Adapted from
[eurosky-social](https://github.com/eurosky-social/eurosky-social-app) and
[tenna.party](https://tangled.org/kris.kralsei.stream/tenna.party), which share
the `social.mu.deco.settings` record format, so an account decorated in either
app renders here unchanged.

## What gates rendering

A DID gets decorations only when both halves exist:

1. **List membership.** The DID is a member of an exact Bluesky list listed in
   `config.ts`. Constellation's `getManyToMany` verifies both links of the
   `app.bsky.graph.listitem` in one request: `subject` points at the profile DID
   and `list` points at any configured list URI. `did` restricts the linking
   record to the list owner, so a listitem someone else forged cannot grant
   access.
2. **Settings record.** One `social.mu.deco.settings/self` record in the
   account's own PDS, holding every slot:
   `{avatar?: frameId, avatarShape?: shape, name?: gradientId, nameOutline?: bool}`.

The record is read through Slingshot because the AppView only serves
`getRecord` for `app.bsky.*` collections. It survives a lapsed membership
dormant, so choices come back if access returns. Unknown ids are ignored, so a
record written by a newer build can never render something this one lacks.

Override the accepted list with `EXPO_PUBLIC_DECO_LIST_URIS` (comma separated).
Setting it to an empty string disables every decoration query.

## One query per DID

`useDecorations.ts` resolves a DID once per 30 minutes: entitlement first, then
the record, and the record query stays disabled without entitlement. The slot
hooks (`useAvatarDecoration`, `useAvatarShape`, `useNameGradient`,
`useNameStyle`) all read that one cache entry, so a feed of the same author does
not fan out into extra requests.

## Rendering

- **Frame** - `AvatarDecorationRing`, an absolute inset ring inside the avatar
  bounds, like the live-status border, so it never overflows the container.
- **Shape** - `circle`, `square`, `squircle`, or `hexagon`. A hexagon cannot be
  a rounded rect, so `HexagonAvatar` clips the image with an SVG `ClipPath` and
  draws the border, frame, and live ring on the same path. This needs no native
  masked-view module, so it works on web and native alike.
- **Gradient** - web paints a real `background-clip: text` gradient. Native
  cannot take a paint gradient, so `GradientNameText` colors each grapheme; font
  metrics are unchanged, so wrapping and `numberOfLines` truncation behave as
  before, and emoji keep their own colors.

A blurred avatar and a blurred display name never render decorations, since the
decoration would reveal the moderated content's shape or name color.

## Editing

Settings -> Profile decorations (`screens/Settings/DecorationsSettings.tsx`)
previews the draft and writes the merged record with the user's own session. The
draft state machine lives in `draft.ts` so the "untouched slots follow the saved
record, touched slots win" rule is testable on its own. `buildDecorationRecord`
in `records.ts` owns the read-modify-write merge: `putRecord` replaces the whole
record, so untouched slots must be carried over and cleared slots omitted.

Choosing decorations does not require list membership; they simply do not render
without it.
