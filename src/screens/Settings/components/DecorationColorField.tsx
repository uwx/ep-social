import {useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Slider} from '#/components/forms/Slider'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'
import {
  hexToOklch,
  normalizeHex,
  type Oklch,
  oklchToHex,
} from '#/features/avatarDecorations'

/** The color the sliders open at when the current value is unreadable. */
const FALLBACK: Oklch = {l: 0.6, c: 0.15, h: 280}

/**
 * Solid color editor: hex entry plus OKLCH sliders. Storing `#rrggbb` keeps the
 * record interoperable while the sliders let the user move lightness, chroma,
 * and hue independently; out-of-gamut positions are mapped back to sRGB, so a
 * slider drag always lands on a color this build can render.
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
  const {t: l} = useLingui()
  const oklch = hexToOklch(value) ?? FALLBACK

  /*
   * The field keeps its own text so half-typed values ("#ff") do not snap back
   * to the last valid color. Adopt an outside change (a slider move) only when
   * the text does not already mean that color: "#123" emits "#112233", and
   * rewriting the box mid-typing would fight the user.
   */
  const [text, setText] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    if (normalizeHex(text) !== value) setText(value)
  }

  function setChannel(patch: Partial<Oklch>) {
    onChange(oklchToHex({...oklch, ...patch}))
  }

  return (
    <View style={[a.gap_xs]} testID={testID}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <View
          style={[
            a.rounded_full,
            {
              width: 32,
              height: 32,
              backgroundColor: value,
              borderWidth: 1,
              borderColor: t.atoms.border_contrast_low.borderColor,
            },
          ]}
        />
        <TextField.Root style={[a.flex_1]}>
          <TextField.Input
            label={label}
            value={text}
            onChangeText={next => {
              setText(next)
              const hex = normalizeHex(next)
              if (hex) onChange(hex)
            }}
            placeholder={null}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            maxLength={7}
            testID={testID ? `${testID}-hex` : undefined}
          />
        </TextField.Root>
      </View>
      <SliderRow
        label={l`Lightness`}
        value={oklch.l}
        minimumValue={0}
        maximumValue={1}
        step={0.01}
        display={oklch.l.toFixed(2)}
        onChange={next => setChannel({l: next})}
      />
      <SliderRow
        label={l`Chroma`}
        value={oklch.c}
        minimumValue={0}
        maximumValue={0.4}
        step={0.005}
        display={oklch.c.toFixed(3)}
        onChange={next => setChannel({c: next})}
      />
      <SliderRow
        label={l`Hue`}
        value={oklch.h}
        minimumValue={0}
        maximumValue={360}
        step={1}
        display={`${Math.round(oklch.h)}°`}
        onChange={next => setChannel({h: next})}
      />
    </View>
  )
}

function SliderRow({
  label,
  value,
  minimumValue,
  maximumValue,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  minimumValue: number
  maximumValue: number
  step: number
  display: string
  onChange: (value: number) => void
}) {
  const t = useTheme()
  return (
    <View style={[a.gap_2xs]}>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        <Text style={[a.text_xs, a.font_semi_bold, t.atoms.text_contrast_medium]}>
          {label}
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>{display}</Text>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{min: minimumValue, max: maximumValue, now: value}}
        accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
        onAccessibilityAction={({nativeEvent}) => {
          if (nativeEvent.actionName === 'increment') {
            onChange(Math.min(maximumValue, value + step))
          } else if (nativeEvent.actionName === 'decrement') {
            onChange(Math.max(minimumValue, value - step))
          }
        }}>
        <Slider
          value={value}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          onValueChange={onChange}
        />
      </View>
    </View>
  )
}
