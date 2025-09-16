import { Platform } from 'react-native'

// Safe haptic feedback wrapper that works in Expo Go
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  // In Expo Go, we can't use react-native-haptic-feedback
  // This is a no-op for now, but in a production build you'd use:
  // HapticFeedback.trigger(
  //   type === 'light' ? 'impactLight' : 
  //   type === 'medium' ? 'impactMedium' : 'impactHeavy'
  // )
  
  // For now, just log in development
  if (__DEV__) {
    console.log(`Haptic feedback: ${type}`)
  }
}