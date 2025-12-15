/**
 * Jest Setup File
 *
 * Configure mocks and global test utilities
 */

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  StyleSheet: {
    create: (styles) => styles,
    hairlineWidth: 1,
  },
  Alert: {
    alert: jest.fn(),
    prompt: jest.fn(),
  },
  Animated: {
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({ __getValue: () => 0 })),
    })),
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    View: 'Animated.View',
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
}))

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
  NetworkStateType: {
    NONE: 'NONE',
    UNKNOWN: 'UNKNOWN',
    CELLULAR: 'CELLULAR',
    WIFI: 'WIFI',
  },
}))

// Mock Supabase
jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
  },
}))

// Mock console methods to keep test output clean (optional)
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

beforeAll(() => {
  // Suppress console.log during tests unless explicitly needed
  console.log = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
})

// Global test timeout (10 seconds)
jest.setTimeout(10000)

// Mock __DEV__ global
global.__DEV__ = true

// Mock fetch globally
global.fetch = jest.fn()

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})
