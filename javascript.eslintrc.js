module.exports = {
  extends: ['eslint:recommended', 'google'],
  env: {
    serviceworker: true,
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  globals: {
    BroadcastChannel: false,
    Comlink: false,
    expect: true,
    sinon: false,
    SyncEvent: false,
    workbox: false,
    Workbox: true,
    WorkboxSW: false,
  },
  rules: {
    'indent': 0,
    'jsdoc/check-types': 2,
    'jsdoc/newline-after-description': 2,
    'operator-linebreak': 0,
    'space-before-function-paren': 0,
    'max-len': [
      2,
      {
        code: 80,
        tabWidth: 2,
        ignoreComments: true,
        ignorePattern: '^\\s*import',
        ignoreUrls: true,
      },
    ],
  },
  plugins: ['jsdoc'],
  settings: {
    jsdoc: {
      preferredTypes: {
        object: 'Object',
      },
    },
  },
  overrides: [
    {
      files: ['test/**/*.{js,mjs}'],
      env: {
        mocha: true,
      },
      globals: {
        expectError: false,
        waitUntil: false,
        SW_NAMESPACES: false,
      },
      rules: {
        'max-len': 0,
        'require-jsdoc': 0,
        'valid-jsdoc': 0,
        'no-invalid-this': 0,
      },
    },
    {
      files: [
        'infra/testing/webdriver/executeAsyncAndCatch.js',
        'infra/testing/webdriver/runUnitTests.js',
        'infra/utils/log-helper.js',
        'packages/workbox-core/_private/logger.mjs',
        'packages/workbox-sw/_default.mjs',
        'packages/workbox-cli/src/lib/logger.js',
        'test/workbox-window/integration/test.js',
        'test/workbox-window/window/test-Workbox.mjs',
      ],
      rules: {
        'no-console': 0,
      },
    },
    {
      files: ['infra/**/*.js'],
      rules: {
        'max-len': 0,
      },
    },
    {
      files: ['gulp-tasks/**/*.js', 'infra/**/*.js', 'test/**/*.js'],
      rules: {
        'camelcase': 0,
        'require-jsdoc': 0,
        'valid-jsdoc': 0,
      },
    },
    {
      files: ['infra/testing/**/*'],
      env: {
        mocha: true,
      },
    },
    {
      files: ['test/*/static/**/*.js'],
      rules: {
        'no-console': 0,
        'no-unused-vars': 0,
        'no-undef': 0,
      },
    },
    {
      files: ['packages/workbox-build/src/templates/**/*.js'],
      rules: {
        'max-len': 0,
      },
    },
    {
      files: ['packages/workbox-sw/**/*'],
      globals: {
        workbox: false,
      },
    },
    {
      files: ['infra/testing/env-it.js'],
      rules: {
        'no-invalid-this': 0,
      },
    },
    {
      files: [
        'gulp-tasks/**/*.{mjs,js}',
        'infra/**/*.{mjs,js}',
        'packages/**/*.{mjs,js}',
        'test/**/*.{mjs,js}',
      ],
      plugins: ['header'],
      rules: {
        'header/header': [2, 'block', {pattern: 'Copyright \\d{4} Google LLC'}],
      },
    },
    {
      files: ['demos/**/*.js'],
      rules: {
        'no-console': 0,
      },
    },
  ],
  // eslint can't parse some of these files.
  ignorePatterns: ['**/wasm-project/**'],
};
