/**
 * Pixel-art badge glyphs, traced from tenna.party's `assets/badges` SVGs (MIT).
 *
 * Each entry is a set of already-colored paths plus its own viewBox, since the
 * characters are drawn at different aspect ratios. Keeping them as paths avoids
 * shipping five 1024px PNGs for something that renders at 13px.
 */
export type BadgeGlyph = {
  viewBox: string
  paths: {fill: string; d: string}[]
}

export const BADGE_GLYPHS: Record<string, BadgeGlyph> = {
  kris: {
    viewBox: '0 0 28 23',
    paths: [
      {
        fill: '#00a2e8',
        d: 'M10 0h8v9h-8zM7 1h3v7H7zM18 1h3v10h-3zM5 2h2v8H5zM21 2h2v10h-2zM4 3h1v18H4zM23 3h1v10h-1zM3 4h1v15H3zM24 4h1v8h-1zM25 5h1v16h-1zM2 6h1v17H2zM26 7h1v15h-1zM8 8h2v3H8zM10 9h2v3h-2zM13 9h5v1h-5zM1 10h1v11H1zM5 10h1v12H5zM16 10h2v1h-2zM27 10h1v10h-1zM9 11h1v1H9zM12 11h1v1h-1zM20 11h1v1h-1zM13 13h8v5h-8zM0 14h1v5H0zM11 14h2v4h-2zM21 14h2v4h-2zM24 14h1v1h-1zM7 15h4v3H7zM24 17h1v5h-1zM8 18h4v1H8zM18 18h4v1h-4zM6 19h1v4H6zM9 19h12v1H9zM23 19h1v4h-1zM7 20h1v2H7zM11 20h8v1h-8zM22 20h1v2h-1zM8 21h1v1H8zM21 21h1v1h-1z',
      },
    ],
  },
  susie: {
    viewBox: '0 0 32 23',
    paths: [
      {
        fill: '#ea79c8',
        d: 'M5 0h9v1H5zM5 1h1v1H5zM14 1h7v1h-7zM6 2h2v1H6zM21 2h3v1h-3zM3 3h3v1H3zM24 3h1v1h-1zM2 4h1v1H2zM25 4h1v1h-1zM1 5h1v3H1zM26 5h1v1h-1zM2 6h4v1H2zM27 6h1v2h-1zM4 7h1v1H4zM5 8h1v2H5zM28 8h1v3h-1zM6 10h2v9H6zM3 11h3v8H3zM8 11h1v8H8zM12 11h1v10h-1zM18 11h1v1h-1zM29 11h1v3h-1zM1 12h2v6H1zM9 12h3v7H9zM13 12h1v9h-1zM19 12h1v1h-1zM0 13h1v4H0zM14 13h3v7h-3zM20 13h1v2h-1zM17 14h3v1h-3zM28 14h1v4h-1zM17 18h1v1h-1zM29 18h1v1h-1zM10 19h2v2h-2zM30 19h1v1h-1zM7 20h3v1H7zM14 20h2v1h-2zM31 20h1v1h-1zM14 21h1v1h-1zM30 21h1v1h-1zM15 22h2v1h-2zM26 22h4v1h-4z',
      },
    ],
  },
  ralsei: {
    viewBox: '0 0 32 24',
    paths: [
      {
        fill: '#b5e61d',
        d: 'M14 0h2v8h-2zM13 1h1v7h-1zM16 1h1v8h-1zM17 2h1v10h-1zM9 3h2v8H9zM18 3h1v8h-1zM21 3h2v9h-2zM8 4h1v7H8zM12 4h1v1h-1zM19 4h1v1h-1zM23 4h1v7h-1zM11 5h1v7h-1zM20 5h1v7h-1zM12 6h1v6h-1zM19 6h1v4h-1zM6 7h2v4H6zM24 7h1v4h-1zM4 8h2v1H4zM15 8h1v1h-1zM25 8h3v2h-3zM5 9h1v1H5zM13 9h1v3h-1zM28 9h1v1h-1zM25 10h2v1h-2zM5 11h1v2H5zM10 11h1v1h-1zM14 11h1v1h-1zM19 11h1v1h-1zM26 11h1v1h-1zM27 12h1v2h-1zM4 13h1v2H4zM11 13h3v1h-3zM19 13h3v1h-3zM10 14h1v1h-1zM14 14h1v1h-1zM18 14h1v1h-1zM22 14h1v1h-1zM28 14h1v2h-1zM3 15h1v2H3zM9 15h1v3H9zM12 15h1v2h-1zM15 15h3v1h-3zM20 15h1v2h-1zM23 15h3v1h-3zM7 16h2v1H7zM15 16h1v2h-1zM17 16h1v2h-1zM23 16h1v2h-1zM29 16h1v1h-1zM0 17h3v1H0zM30 17h2v1h-2zM0 18h1v1H0zM10 18h1v1h-1zM14 18h1v1h-1zM18 18h1v1h-1zM22 18h1v1h-1zM28 18h3v1h-3zM1 19h1v1H1zM4 19h1v1H4zM11 19h3v1h-3zM19 19h3v1h-3zM28 19h1v1h-1zM2 20h2v1H2zM29 20h1v2h-1zM3 21h1v1H3zM7 21h1v1H7z',
      },
      {fill: '#F60E97', d: 'M8 21h2v3H8zM23 21h1v3h-1z'},
      {
        fill: '#b5e61d',
        d: 'M24 21h1v2h-1zM26 21h3v1h-3zM30 21h1v1h-1zM4 22h2v1H4z',
      },
      {fill: '#F60E97', d: 'M7 22h1v2H7zM10 22h4v2h-4zM20 22h3v2h-3z'},
      {fill: '#b5e61d', d: 'M25 22h1v1h-1zM27 22h1v1h-1z'},
      {fill: '#F60E97', d: 'M6 23h1v1H6zM14 23h6v1h-6z'},
    ],
  },
  noelle: {
    viewBox: '0 0 28 24',
    paths: [
      {
        fill: '#ffff00',
        d: 'M0 0h3v2H0zM25 0h3v2h-3zM4 1h2v2H4zM11 1h7v1h-7zM22 1h2v2h-2zM1 2h3v3H1zM7 2h4v1H7zM17 2h3v1h-3zM24 2h3v3h-3zM0 3h1v3H0zM4 3h1v7H4zM6 3h1v2H6zM20 3h2v1h-2zM23 3h1v7h-1zM27 3h1v3h-1zM5 4h1v3H5zM21 4h2v1h-2zM1 5h2v1H1zM22 5h1v2h-1zM25 5h2v1h-2zM10 6h1v16h-1zM11 8h1v11h-1zM9 9h1v12H9zM12 10h1v5h-1zM1 11h4v2H1zM8 11h1v9H8zM13 11h1v4h-1zM23 11h4v2h-4zM14 12h2v3h-2zM2 13h3v1H2zM7 13h1v5H7zM16 13h1v6h-1zM23 13h3v1h-3zM2 14h2v1H2zM17 14h3v6h-3zM24 14h2v1h-2zM15 15h1v4h-1zM20 15h1v3h-1zM3 16h1v4H3zM12 16h1v3h-1zM14 16h1v2h-1zM24 16h1v4h-1zM4 19h1v3H4zM13 19h2v2h-2zM23 19h1v3h-1zM11 20h1v3h-1zM16 20h3v1h-3zM16 21h2v1h-2zM2 22h2v1H2zM12 22h5v1h-5zM24 22h2v1h-2zM3 23h1v1H3zM24 23h1v1h-1z',
      },
    ],
  },
}
