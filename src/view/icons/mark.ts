/**
 * The brand mark: a cat's head with two ears, drawn by `<Logo>` and by the
 * splash screens.
 *
 * It lives in its own module because the splash has to render it before the
 * app mounts, and importing `Logo.tsx` would pull in the theme, image and
 * persisted-state modules along the way.
 */
export const MARK_VIEW_BOX = '0 0 512 512'
/*
 * Three subpaths (head, left ear, right ear) wound the same way, so the
 * overlapping silhouettes union under the default non-zero fill rule. Each ear
 * starts on the head's outline where its edge is tangent to it, which keeps the
 * join smooth at any size.
 */
export const MARK_PATH =
  'M80 314A176 150 0 1 1 432 314A176 150 0 1 1 80 314ZM81.4 294.9L107 124.9Q118 52 158.1 136.3L236 300ZM276 300L353.9 136.3Q394 52 405 124.9L430.6 294.9Z'
