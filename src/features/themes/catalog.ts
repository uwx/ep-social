import {materialYouRecord} from './materialYou'
import {type ActiveTheme, type ThemeRecord, type ThemeView} from './types'

const createdAt = '2026-08-18T00:00:00.000Z'
const themeCollection = 'app.witchsky.theme.colors'
const witchskyDid = 'did:plc:nstiflhvn4dywu5xlwq5wp4v'

export const WITCHSKY_THEME: ThemeRecord = {
  $type: themeCollection,
  name: 'Purrsky',
  description: 'Warm cream and gold, designed for Purrsky.',
  mode: 'light',
  recommendedPair: `at://${witchskyDid}/${themeCollection}/3mug7d56zc42i`,
  createdAt,
  base: {
    name: 'Moonmilk',
    colors: {
      canvas: '#f6f0e7',
      surface: '#e8e2d9',
      surfaceRaised: '#fffbff',
      text: '#221b00',
      textMuted: '#615e57',
      border: '#cbc6bd',
      accent: '#6e5d0e',
      accentSoft: '#fae287',
      onAccent: '#ffffff',
      positive: '#09b35e',
      warning: '#d89200',
      critical: '#e91646',
      favorite: '#dd5e8f',
    },
  },
}

export const WITCHSKY_DARK_THEME: ThemeRecord = {
  $type: themeCollection,
  name: 'Purrsky Dark',
  description: 'Warm cream and gold, designed for Purrsky after dark.',
  mode: 'dark',
  recommendedPair: `at://${witchskyDid}/${themeCollection}/3mug7d56zc32i`,
  createdAt,
  base: {
    name: 'Coven',
    colors: {
      canvas: '#1d1b16',
      surface: '#282520',
      surfaceRaised: '#33302a',
      text: '#fefbfb',
      textMuted: '#afaba2',
      border: '#494640',
      accent: '#dcc66e',
      accentSoft: '#544600',
      onAccent: '#3a3000',
      positive: '#0ac266',
      warning: '#ffc404',
      critical: '#eb2452',
      favorite: '#dd5e8f',
    },
  },
  variants: [
    {
      name: 'Midnight',
      colors: {
        canvas: '#12110d',
        surface: '#1d1b16',
        positive: '#09b35e',
        critical: '#e91646',
      },
    },
  ],
}

function fallback(record: ThemeRecord, rkey: string, cid: string): ThemeView {
  return {
    uri: `at://${witchskyDid}/${themeCollection}/${rkey}`,
    cid,
    author: 'witchsky.app',
    record,
    source: 'builtin',
  }
}

/** Used only when the remotely managed featured collection is unavailable. */
export const FEATURED_THEMES = [
  fallback(
    WITCHSKY_THEME,
    '3mug7d56zc32i',
    'bafyreiecuisoynzapf4u3qxezl3tpnsd6q7mgbsi7tttsfvnv5rb5k66wa',
  ),
  fallback(
    WITCHSKY_DARK_THEME,
    '3mug7d56zc42i',
    'bafyreifxzld23aw5pt3qkyp3af5mvzkleity3ldotxglk5g4uvvsleq7re',
  ),
]

export const WITCHSKY_ACTIVE_THEME: ActiveTheme = {
  light: {...FEATURED_THEMES[0], colorSet: 'Moonmilk'},
  dark: {...FEATURED_THEMES[1], colorSet: 'Coven'},
}

/**
 * Material You default. Colors are regenerated from the accent (web) or the
 * system palette (native) at runtime; the builtin cid keeps update polling
 * from asking users to replace a locally generated record.
 */
export const DEFAULT_ACTIVE_THEME: ActiveTheme = {
  light: {
    ...fallback(
      materialYouRecord('light'),
      '3mug7d56nl22i',
      'builtin-material-you',
    ),
    colorSet: 'Tonal Spot',
  },
  dark: {
    ...fallback(
      materialYouRecord('dark'),
      '3mug7d56zc22i',
      'builtin-material-you',
    ),
    colorSet: 'Tonal Spot',
  },
}
