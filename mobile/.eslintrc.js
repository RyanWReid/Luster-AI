module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  env: {
    'react-native/react-native': true,
    es2021: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // ===========================================
    // BUG PREVENTION - These catch real bugs
    // ===========================================

    // Catch missing await (causes silent failures)
    '@typescript-eslint/no-floating-promises': 'error',

    // Catch unused variables (dead code hiding bugs)
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    // Catch accidental any types (type safety holes)
    '@typescript-eslint/no-explicit-any': 'warn',

    // Catch missing hook dependencies (stale closure bugs)
    'react-hooks/exhaustive-deps': 'warn',

    // Catch missing keys in lists (React reconciliation bugs)
    'react/jsx-key': 'error',

    // Catch async issues in useEffect
    'react-hooks/rules-of-hooks': 'error',

    // ===========================================
    // CODE QUALITY - Prevent common mistakes
    // ===========================================

    // Require === instead of == (type coercion bugs)
    'eqeqeq': ['error', 'always'],

    // No console.log in production (but warn, don't error)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Catch unreachable code
    'no-unreachable': 'error',

    // Catch duplicate keys in objects
    'no-dupe-keys': 'error',

    // Catch duplicate case labels
    'no-duplicate-case': 'error',

    // ===========================================
    // REACT NATIVE SPECIFIC
    // ===========================================

    // Enforce StyleSheet usage (performance)
    'react-native/no-inline-styles': 'warn',

    // Catch unused styles (enable later after cleanup)
    'react-native/no-unused-styles': 'warn',

    // Sort styles alphabetically (disable - too noisy)
    'react-native/sort-styles': 'off',

    // Warn on raw text outside Text component
    'react-native/no-raw-text': 'off', // Too noisy, disable for now

    // Color literals should be in theme
    'react-native/no-color-literals': 'off', // Enable later with design system

    // ===========================================
    // RELAXED RULES (to avoid noise)
    // ===========================================

    // Allow require() for images (React Native pattern)
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',

    // Animated.Value pattern uses .current during render (RN-specific)
    'react-hooks/refs': 'off',

    // React 17+ doesn't need React import
    'react/react-in-jsx-scope': 'off',

    // Allow inline function props (common in RN)
    'react/jsx-no-bind': 'off',

    // Prop types not needed with TypeScript
    'react/prop-types': 'off',

    // Display name not critical
    'react/display-name': 'off',

    // Split platform files are fine
    'react-native/split-platform-components': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    'babel.config.js',
    'metro.config.js',
    '*.config.js',
  ],
};
