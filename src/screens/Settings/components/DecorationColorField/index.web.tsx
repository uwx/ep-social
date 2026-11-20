import {createElement, useState} from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {normalizeHex} from '#/features/avatarDecorations/oklch'
import {ColorFieldRow, SWATCH_SIZE, swatchStyle} from './shared'

/**
 * Solid color editor on web.
 *
 * The native build uses `reanimated-color-picker`, which is gesture-driven and
 * imports react-native-gesture-handler; the web bundle refuses that module
 * outright (see `metro.config.ts`), and the picker's worklets have no gesture
 * runtime here anyway. The browser already ships a color picker, so the chip
 * carries a transparent `<input type="color">`: clicking it opens the OS
 * picker, and `input` events stream into the same `#rrggbb` slot the native
 * build stores.
 *
 * The input is a DOM element on purpose - react-native-web's `createElement`
 * filters props down to its own list and would drop `value`/`onChange`.
 */
export function DecorationColorField({
  label,
  value,
  onChange,
  testID,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
  testID?: string
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <ColorFieldRow
      label={label}
      value={value}
      onChange={onChange}
      testID={testID}
      swatch={
        <View style={{width: SWATCH_SIZE, height: SWATCH_SIZE}}>
          <View
            aria-hidden
            style={swatchStyle(value, t.atoms.border_contrast_low.borderColor)}
          />
          {createElement('input', {
            type: 'color',
            value: normalizeHex(value) ?? '#000000',
            'aria-label': label,
            'data-testid': testID ? `${testID}-swatch` : undefined,
            onFocus: () => setFocused(true),
            onBlur: () => setFocused(false),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              const hex = normalizeHex(event.currentTarget.value)
              if (hex) onChange(hex)
            },
            style: {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0,
              border: 'none',
              opacity: 0,
              cursor: 'pointer',
            },
          })}
          {focused && (
            <View
              aria-hidden
              pointerEvents="none"
              style={[
                a.rounded_full,
                {
                  position: 'absolute',
                  top: -4,
                  left: -4,
                  right: -4,
                  bottom: -4,
                  borderWidth: 2,
                  borderColor: t.palette.primary_500,
                },
              ]}
            />
          )}
        </View>
      }
    />
  )
}
