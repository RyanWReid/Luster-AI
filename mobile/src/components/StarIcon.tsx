import React from 'react'
import { View } from 'react-native'
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'

interface StarIconProps {
  size?: number
}

export default function StarIcon({ size = 80 }: StarIconProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgLinearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#fbbf24" />
            <Stop offset="50%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#fb923c" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M50 5 L35 50 L5 50 L35 50 L50 95 L65 50 L95 50 L65 50 Z"
          fill="url(#starGradient)"
        />
      </Svg>
    </View>
  )
}