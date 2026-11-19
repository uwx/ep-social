import {Text} from 'react-native'
import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'
import {APP_NAME} from '#/env'
import {DRAWN_NAME, LETTERFORMS, WORDMARK_VIEW_BOX} from './wordmark'

const ratio = 21 / 95

export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-expect-error it's fiiiiine
  const size = parseInt(rest.width || 32)

  if (APP_NAME !== DRAWN_NAME) {
    return (
      <Text
        accessibilityRole="text"
        numberOfLines={1}
        style={{
          height: size * ratio,
          color: typeof fill === 'string' ? fill : pal.text.color,
          fontSize: size * 0.215,
          lineHeight: size * ratio,
          fontWeight: '600',
          letterSpacing: -0.01 * size * 0.215,
        }}>
        {APP_NAME}
      </Text>
    )
  }

  return (
    <Svg
      fill="none"
      viewBox={WORDMARK_VIEW_BOX}
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      {LETTERFORMS.map(d => (
        <Path key={d} fill={fill || pal.text.color} d={d} />
      ))}
    </Svg>
  )
}
