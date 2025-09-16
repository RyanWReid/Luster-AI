import React, { useRef, useState } from 'react'
import {
  ScrollView,
  View,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle,
} from 'react-native'

const { width } = Dimensions.get('window')

interface FallbackPagerViewProps {
  style?: ViewStyle
  initialPage?: number
  onPageSelected?: (e: any) => void
  children: React.ReactNode
}

// Fallback pager view using ScrollView for Expo Go compatibility
export const FallbackPagerView = React.forwardRef<any, FallbackPagerViewProps>(
  ({ style, initialPage = 0, onPageSelected, children }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null)
    const [currentPage, setCurrentPage] = useState(initialPage)

    React.useImperativeHandle(ref, () => ({
      setPage: (page: number) => {
        scrollViewRef.current?.scrollTo({ x: page * width, animated: true })
      },
    }))

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x
      const page = Math.round(offsetX / width)
      
      if (page !== currentPage) {
        setCurrentPage(page)
        onPageSelected?.({ nativeEvent: { position: page } })
      }
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        style={style}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: initialPage * width, y: 0 }}
      >
        {React.Children.map(children, (child, index) => (
          <View key={index} style={{ width }}>
            {child}
          </View>
        ))}
      </ScrollView>
    )
  }
)

FallbackPagerView.displayName = 'FallbackPagerView'