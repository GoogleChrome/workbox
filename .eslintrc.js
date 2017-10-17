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
    google: false,
    SyncEvent: false,
  },
  rules: {
    "jsdoc/check-types": 2,
    "jsdoc/newline-after-description": 2,
  },
  plugins: [
    'jsdoc',
  ],
  parser: 'babel-eslint',
  overrides: [{
    files: ['test/**/*.{js,mjs}'],
    env: {
      mocha: true,
    },
    rules: {
      'max-len': 0,
      'require-jsdoc': 0,
      'valid-jsdoc': 0,
      'no-invalid-this': 0,
    },
  }, {
    files: [
      'packages/workbox-core/utils/logger.mjs',
      'packages/workbox-sw/index.mjs',
      'infra/testing/cli-test-helper.js',
      'infra/utils/log-helper.js',
      'packages/workbox-cli/src/lib/logger.js',
      'test/workbox-precaching/node/controllers/test-PrecacheController.mjs',
      'test/workbox-precaching/node/utils/test-showWarningsIfNeeded.mjs',
    ],
    rules: {
      'no-console': 0,
    },
  }, {
    files: [
      'infra/**/*.js',
    ],
    rules: {
      'max-len': 0,
    },
  }, {
    files: [
      'gulp-tasks/**/*.js',
      'infra/**/*.js'
    ],
    rules: {
      'valid-jsdoc': 0,
      'require-jsdoc': 0,
    },
  }, {
    files: [
      'infra/testing/**/*',
    ],
    env: {
      'mocha': true
    }
  }, {
    files: [
      'test/workbox-build/static/**/*.js',
    ],
    rules: {
      'no-unused-vars': 0,
      'no-undef': 0,
    },
  }, {
    files: [
      'packages/workbox-build/src/templates/**/*.js',
    ],
    rules: {
      'max-len': 0,
    },
  }
  , {
    files: [
      'packages/workbox-sw/**/*',
    ],
    globals: {
      'workbox': false,
    },
  }, {
    files: [
      'infra/testing/env-it.js',
    ],
    rules: {
      'no-invalid-this': 0,
    },
  }, {
    files: [
      'packages/**/*.{mjs,js}',
    ],
    plugins: [
      'header',
    ],
    rules: {
      'header/header': [2, 'block', {pattern: 'Copyright \\d{4} Google Inc.'}]
    }
  }],
};
