import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/RootNavigator'

const starLogo = require('../../assets/star-logo.png')
const textLogo = require('../../assets/text-logo.png')
const welcomeBackground = require('../../assets/welcome.png')

type NavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>()

  return (
    <ImageBackground
      source={welcomeBackground}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          {/* Logo and Brand */}
          <View style={styles.logoContainer}>
            <Image
              source={starLogo}
              style={styles.starLogo}
              contentFit="contain"
              onError={(error) => {
                console.log('Star logo error:', error)
              }}
            />
            <Image
              source={textLogo}
              style={styles.textLogo}
              contentFit="contain"
              onError={(error) => {
                console.log('Text logo error:', error)
              }}
            />
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Bottom Actions */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#fbbf24', '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Text style={styles.arrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starLogo: {
    width: 215,
    height: 215,
    marginBottom: 10,
  },
  textLogo: {
    width: 200,
    height: 50,
  },
  spacer: {
    flex: 0.5,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: 20,
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
    marginBottom: 20,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
  },
  getStartedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  arrow: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  loginText: {
    fontSize: 16,
    color: '#6b7280',
  },
  loginLink: {
    color: '#111827',
    textDecorationLine: 'underline',
  },
})