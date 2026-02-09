import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  PanResponder,
} from 'react-native'
import CachedImage from './CachedImage'
import { BlurView } from 'expo-blur'
import hapticFeedback from '../utils/haptics'
import Svg, { Line, Circle } from 'react-native-svg'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface ComparisonSliderProps {
  beforeImage: any
  afterImage: any
  height?: number
}

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  height = 400
}: ComparisonSliderProps) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH)
  const [sliderPosition, setSliderPosition] = useState(SCREEN_WIDTH / 2)
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH / 2)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const labelOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Reset slider to center when container width changes
    const centerPosition = containerWidth / 2
    setSliderPosition(centerPosition)
    slideAnim.setValue(centerPosition)

    // Initial pulse animation to draw attention
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    // Fade labels after 3 seconds
    setTimeout(() => {
      Animated.timing(labelOpacity, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }, 3000)
  }, [containerWidth])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        hapticFeedback.light()

        // Show labels when dragging starts
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start()
      },

      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.min(
          Math.max(30, sliderPosition + gestureState.dx),
          containerWidth - 30
        )

        slideAnim.setValue(newPosition)

        // Haptic feedback at edges and center
        const prevPosition = sliderPosition
        if (
          (prevPosition > containerWidth / 2 - 5 && newPosition <= containerWidth / 2 + 5) ||
          (prevPosition < containerWidth / 2 + 5 && newPosition >= containerWidth / 2 - 5)
        ) {
          hapticFeedback.light()
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        const newPosition = Math.min(
          Math.max(30, sliderPosition + gestureState.dx),
          containerWidth - 30
        )

        setSliderPosition(newPosition)

        // Fade labels after release
        setTimeout(() => {
          Animated.timing(labelOpacity, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }).start()
        }, 1000)

        // Pulse animation on release
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start()
      },
    })
  ).current

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout
        setContainerWidth(width)
      }}
    >
      {/* After Image (Right) */}
      <View style={styles.imageContainer}>
        <CachedImage source={afterImage} style={styles.image} />
      </View>

      {/* Before Image (Left) - Overlaid and clipped */}
      <Animated.View
        style={[
          styles.beforeContainer,
          {
            width: slideAnim,
          },
        ]}
      >
        <CachedImage
          source={beforeImage}
          style={[styles.beforeImage, { width: containerWidth }]}
        />
      </Animated.View>

      {/* Labels */}
      <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
        <BlurView intensity={60} style={styles.beforeLabel}>
          <Text style={styles.labelText}>BEFORE</Text>
        </BlurView>
      </Animated.View>

      <Animated.View
        style={[
          styles.labelContainer,
          styles.afterLabelContainer,
          { opacity: labelOpacity }
        ]}
      >
        <BlurView intensity={60} style={styles.afterLabel}>
          <Text style={styles.labelText}>AFTER</Text>
        </BlurView>
      </Animated.View>

      {/* Slider Control */}
      <Animated.View
        style={[
          styles.sliderLine,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Vertical Line */}
        <View style={styles.verticalLine} />

        {/* Handle */}
        <Animated.View
          style={[
            styles.handle,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <BlurView intensity={80} style={styles.handleBlur}>
            <View style={styles.handleInner}>
              <Svg width={24} height={24} style={styles.handleIcon}>
                <Line
                  x1="7"
                  y1="12"
                  x2="2"
                  y2="12"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Line
                  x1="17"
                  y1="12"
                  x2="22"
                  y2="12"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="2"
                />
              </Svg>
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  beforeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  beforeImage: {
    height: '100%',
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -20,
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  handle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  handleInner: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleIcon: {
    transform: [{ rotate: '90deg' }],
  },
  labelContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  afterLabelContainer: {
    left: 'auto',
    right: 20,
  },
  beforeLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  afterLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
})