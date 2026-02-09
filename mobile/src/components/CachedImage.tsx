import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Image, ImageProps, ImageSource } from 'expo-image'

// Gray placeholder color
const PLACEHOLDER_COLOR = '#E5E7EB'

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  /** Image source - can be string URI or { uri: string } object */
  source: string | { uri: string } | ImageSource | null | undefined
  /** Placeholder color (defaults to gray) */
  placeholderColor?: string
  /** Transition duration in ms (defaults to 200) */
  transitionDuration?: number
}

/**
 * CachedImage - A wrapper around expo-image with built-in caching and loading states
 *
 * Features:
 * - Disk caching (persists across app restarts)
 * - Memory caching (fast access for visible images)
 * - Gray placeholder while loading
 * - Smooth fade-in transition when loaded
 * - Handles various source formats (string, { uri }, null)
 */
export default function CachedImage({
  source,
  style,
  placeholderColor = PLACEHOLDER_COLOR,
  transitionDuration = 200,
  contentFit = 'cover',
  ...props
}: CachedImageProps) {
  // Normalize source to expo-image format
  const normalizedSource = React.useMemo(() => {
    if (!source) return null
    if (typeof source === 'string') {
      return { uri: source }
    }
    return source
  }, [source])

  // Don't render if no source
  if (!normalizedSource) {
    return (
      <View style={[styles.placeholder, { backgroundColor: placeholderColor }, style]} />
    )
  }

  // Extract URI for recycling key (helps with cache reuse)
  const recyclingKey = typeof normalizedSource === 'object' && 'uri' in normalizedSource
    ? normalizedSource.uri
    : undefined

  return (
    <Image
      source={normalizedSource}
      style={[{ backgroundColor: placeholderColor }, style]}
      contentFit={contentFit}
      cachePolicy="disk"
      recyclingKey={recyclingKey}
      transition={transitionDuration}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: PLACEHOLDER_COLOR,
  },
})
