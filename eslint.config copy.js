// eslint.config.js - ESLint v9+ Flat Config (ES Module)
export default [
  // Base configuration for all JavaScript files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module", // Changed from "script" to "module"
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        URLSearchParams: "readonly",
        Image: "readonly",
        Blob: "readonly",
        URL: "readonly",
        navigator: "readonly",
        prompt: "readonly",
        confirm: "readonly",

        // Google Apps Script globals (for apps-script.js)
        SpreadsheetApp: "readonly",
        ContentService: "readonly",
        Utilities: "readonly",
        Session: "readonly",

        // Your chrono app globals - remove duplicates
        // records: "writable", // Remove - let it be declared in code
        // lastSyncCount: "writable", // Remove - let it be declared in code
        // DEFAULT_WEBHOOK_URL: "readonly" // Remove - let it be declared in code
      },
    },
    rules: {
      // Unused code detection - RELAXED for functions called externally
      "no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: false,
          varsIgnorePattern:
            "^(test|creer|initialiser|diagnostic|switchTab|modifier|supprimer|exporter|vider|lastBackupTime|reject|sheet|spreadsheet)", // Extended pattern
        },
      ],
      "no-unreachable": "error",

      // Code quality
      "no-console": "off", // Keep console.log for your debugging
      "no-debugger": "warn",
      "no-alert": "off", // Turn off prompt/confirm warnings

      // Best practices for timing app
      eqeqeq: "error", // === instead of ==
      "no-eval": "error",
      "no-implied-eval": "error",

      // Variables
      "no-undef": "error",
      "no-redeclare": "error",

      // Formatting (if not using Prettier)
      indent: ["error", 2],
      quotes: ["error", "single"],
      semi: ["error", "always"],
    },
  },

  // Configuration specific for Google Apps Script
  {
    files: ["**/apps-script.js"],
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^(e|_)" }], // Ignore 'e' parameter
      "no-undef": "off", // Apps Script has many globals
    },
  },

  // Configuration for HTML files with embedded JS
  {
    files: ["**/*.html"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      // Relaxed rules for HTML embedded JS
      "no-unused-vars": "warn",
      "no-undef": "off", // HTML might have globals we don't know about
    },
  },

  // Ignore patterns (replaces .eslintignore)
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "*.min.js"],
  },
];
