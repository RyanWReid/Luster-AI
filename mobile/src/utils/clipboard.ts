import { Alert } from 'react-native'

// Safe clipboard wrapper that works in Expo Go
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // Try to use the Clipboard module if available
    const Clipboard = require('@react-native-clipboard/clipboard').default
    await Clipboard.setString(text)
  } catch (error) {
    // Fallback for Expo Go - just show an alert with the text
    if (__DEV__) {
      console.log('Clipboard not available in Expo Go')
      Alert.alert(
        'Copy to Clipboard',
        'In production, this text would be copied:\n\n' + text.substring(0, 100) + '...',
        [{ text: 'OK' }]
      )
    }
  }
}

export const getFromClipboard = async (): Promise<string> => {
  try {
    const Clipboard = require('@react-native-clipboard/clipboard').default
    return await Clipboard.getString()
  } catch (error) {
    if (__DEV__) {
      console.log('Clipboard not available in Expo Go')
    }
    return ''
  }
}