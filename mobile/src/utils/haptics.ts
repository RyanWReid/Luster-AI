// Safe wrapper for haptic feedback
// Handles cases where expo-haptics might not be available

let Haptics: any = null

try {
  Haptics = require('expo-haptics')
} catch (error) {
  console.log('Haptics not available on this platform')
}

export const hapticFeedback = {
  light: async () => {
    if (Haptics?.impactAsync) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } catch (error) {
        // Silently fail if haptics unavailable
      }
    }
  },

  medium: async () => {
    if (Haptics?.impactAsync) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } catch (error) {
        // Silently fail if haptics unavailable
      }
    }
  },

  heavy: async () => {
    if (Haptics?.impactAsync) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      } catch (error) {
        // Silently fail if haptics unavailable
      }
    }
  },

  selection: async () => {
    if (Haptics?.selectionAsync) {
      try {
        await Haptics.selectionAsync()
      } catch (error) {
        // Silently fail if haptics unavailable
      }
    }
  },

  notification: async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (Haptics?.notificationAsync) {
      try {
        const feedbackType = {
          success: Haptics.NotificationFeedbackType?.Success,
          warning: Haptics.NotificationFeedbackType?.Warning,
          error: Haptics.NotificationFeedbackType?.Error,
        }[type]

        if (feedbackType) {
          await Haptics.notificationAsync(feedbackType)
        }
      } catch (error) {
        // Silently fail if haptics unavailable
      }
    }
  },
}

export default hapticFeedback