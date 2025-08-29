// eslint.config.js - ESLint v9+ Flat Config
export default [
  // Base configuration for all JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script', // or "module" if you use ES modules
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',

        // Your chrono app globals
        records: 'writable',
        lastSyncCount: 'writable',
        DEFAULT_WEBHOOK_URL: 'readonly',
      },
    },
    rules: {
      // Unused code detection
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
        },
      ],
      'no-unreachable': 'error',

      // Code quality
      'no-console': 'off', // Keep console.log for your debugging
      'no-debugger': 'warn',
      'no-alert': 'warn',

      // Best practices for timing app
      eqeqeq: 'error', // === instead of ==
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // Variables
      'no-undef': 'error',
      'no-redeclare': 'error',

      // Formatting (if not using Prettier)
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },

  // Configuration for HTML files with embedded JS
  {
    files: ['**/*.html'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      // Relaxed rules for HTML embedded JS
      'no-unused-vars': 'warn',
      'no-undef': 'off', // HTML might have globals we don't know about
    },
  },

  // Ignore patterns (replaces .eslintignore)
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '*.min.js'],
  },
];
