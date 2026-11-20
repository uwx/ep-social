# Profile decorations

Avatar frames, avatar shapes, and display-name paints. Adapted from
[eurosky-social](https://github.com/eurosky-social/eurosky-social-app) and
[tenna.party](https://tangled.org/kris.kralsei.stream/tenna.party), which share
the `social.mu.deco.settings` record format, so an account decorated in either
app renders here unchanged.

## What gates rendering

A DID renders decorations when it has a `social.mu.deco.settings/self` record
in its own PDS:

```ts
{
  avatar?: frameId
  avatarShape?: shape
  name?: gradientId // curated preset
  nameOutline?: boolean
  avatarColor?: string // #rrggbb, overrides the frame color
  nameColor?: string // #rrggbb, arbitrary solid name fill
  nameGradient?: {colors: string[]; hard?: boolean} // 2-3 #rrggbb stops
  nameFont?: string // Google Fonts family
}
```

Every added slot is optional and additive, so an older client keeps rendering
`avatar`/`avatarShape`/`name`/`nameOutline` and ignores the rest. Parsing is
strict (`records.ts`): malformed colors, stop counts outside 2-3, and font
families outside the shipped catalog are dropped rather than rendered.

The record is read through Slingshot because the AppView only serves
`getRecord` for `app.bsky.*` collections. Unknown ids are ignored, so a record
written by a newer build can never render something this one lacks.

Any account can set decorations by writing that record; no list membership or
allowlist is checked. Since the record is public and self-authored, decorations
are purely cosmetic and must never carry trust.

## One query per DID

`useDecorations.ts` resolves a DID's record once per 30 minutes. The slot hooks
(`useAvatarDecoration`, `useAvatarShape`, `useNameGradient`, `useNameStyle`) all
read that one cache entry, so a feed of the same author does not fan out into
extra requests.

## Rendering

- **Frame** - `AvatarDecorationRing`, an absolute inset ring inside the avatar
  bounds, like the live-status border, so it never overflows the container.
  `resolveFrame` applies `avatarColor` over the curated frame's own color, and
  synthesizes a ring when a record names a color but no preset.
- **Shape** - `circle`, `square`, `squircle`, or `hexagon`. A hexagon cannot be
  a rounded rect, so `HexagonAvatar` clips the image with an SVG `ClipPath` and
  draws the border, frame, and live ring on the same path. This needs no native
  masked-view module, so it works on web and native alike. The clip id is
  unique per mounted instance: browsers resolve `url(#id)` to the first match in
  document order, so a shared id can resolve into an inactive screen kept
  mounted with `display: none`, which leaves the image unclipped.
- **Name paint** - `namePaint.ts` resolves one record slot into
  `{gradient?, color?, outline, font?}`. Precedence is custom gradient, custom
  solid, then the curated `name` preset; `useNameStyle` turns the result into a
  text style so every call site stays unaware of which paint is in play.
- **Gradient** - web paints a real `background-clip: text` gradient. Stops are
  sampled in OKLCH first (`oklch.ts`) and handed to the browser as hex, because
  browsers interpolate hex stops in sRGB and would bend the ramp (`in oklch` is
  still too new to depend on). Native cannot take a paint gradient, so
  `GradientNameText` colors each grapheme using the same sampling; font metrics
  are unchanged, so wrapping and `numberOfLines` truncation behave as before,
  and emoji keep their own colors.
- **Outline** - `outlineColorFor` picks the edge color that maximizes the
  minimum WCAG contrast across the gradient stops: near-black by default, white
  when the fill is dark enough to swallow a dark edge. Web draws it with four
  axis-aligned `drop-shadow`s, native with a tight `textShadow`.
- **Fonts** - no font file is bundled. `googleFonts.ts` is a generated catalog
  of ~1800 latin families, and `nameFonts.ts` fetches a face the first time a
  name actually renders with it: a `<link>`-injected css2 response on web
  (woff2, split by `unicode-range`), a legacy-UA TTF registered through
  `expo-font` on native. Faces load under an `nf_` alias so a device-installed
  family of the same name can never shadow it. The picker uses a separate
  `nf_<family>__preview` alias with `text=` subsetting, because `expo-font`
  ignores a later load of an already-loaded family.

A blurred avatar and a blurred display name never render decorations, since the
decoration would reveal the moderated content's shape or name color.

## Viewer preferences

Two viewer-side display options (`state/preferences`) sit on top of the record:

- `showNameOutlines` - adds an outline to decorated names (gradient or custom
  color) whose owner did not enable one. Plain theme-colored names are left
  alone: they already contrast with the page, and a fixed-color halo would hurt
  one of the two themes.
- `disableCustomNameStyles` - ignores `nameColor`, `nameGradient`, and
  `nameFont` from other accounts. Curated presets and avatar frame/shape keep
  rendering.

## Editing

Settings -> Profile decorations (`screens/Settings/DecorationsSettings.tsx`)
previews the draft and writes the merged record with the user's own session. The
draft state machine lives in `draft.ts` so the "untouched slots follow the saved
record, touched slots win" rule is testable on its own. `buildDecorationRecord`
in `records.ts` owns the read-modify-write merge: `putRecord` replaces the whole
record, so untouched slots must be carried over and cleared slots omitted. It
also enforces one name paint at a time, so a record can hold a custom gradient
or a custom solid or a preset, never two.

Color entry is a swatch plus a hex box (`DecorationColorField`), so the picker
never gets between the user and an exact value; the record stores `#rrggbb`.
Native opens `reanimated-color-picker` in a dialog. The web bundle bans
react-native-gesture-handler, which that picker imports, so the web field
(`index.web.tsx`) opens `@terrazzo/react-color-picker` - an OKLCH picker whose
channel sliders are WebGL2 - pinned to 0.3.0. That package's CSS follows the OS
color scheme and leaves semantic variables undefined, so `terrazzoTheme.ts`
maps them onto the active ALF theme while the dialog is open. Browsers without
WebGL2 (jsdom included) would unmount the dialog when the shader init throws,
so `canvasSupport.ts` gates it and those browsers get a transparent
`<input type="color">` over the swatch instead.

## Regenerating the font catalog

`node scripts/generate-google-fonts.mjs` rewrites `googleFonts.ts` from
`https://fonts.google.com/metadata/fonts` (latin subset, upright 400 face,
sorted by Google's popularity rank) and caches the download in `scripts/.cache/`.
Pass `--refresh` to re-download. Rerun it when Google adds or retires families;
faces are resolved by name at runtime, so no URL here can go stale.
