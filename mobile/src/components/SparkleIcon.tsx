import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface SparkleIconProps {
  size?: number
  color?: string
}

export default function SparkleIcon({ size = 24, color = 'white' }: SparkleIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v6m0 8v6M6 12h6m8 0h-6"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M12 8a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2V9a1 1 0 011-1z"
        fill={color}
      />
      <Path
        d="M5.5 5.5l2 2m9 9l2 2m0-13l-2 2m-9 9l-2 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  )
}