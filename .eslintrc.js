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
    "jsdoc/check-types": 2,
    "jsdoc/newline-after-description": 2,
    "max-len": [2, {
      code: 80,
      tabWidth: 2,
      ignoreComments: true,
      "ignorePattern": "^\\s*import",
      "ignoreUrls": true
    }]
  },
  plugins: [
    'jsdoc',
  ],
  overrides: [{
    files: ['test/**/*.{js,mjs}'],
    parser: 'babel-eslint',
    env: {
      mocha: true,
    },
    globals: {
      expectError: false
    },
    rules: {
      'max-len': 0,
      'require-jsdoc': 0,
      'valid-jsdoc': 0,
      'no-invalid-this': 0,
    },
  }, {
    files: [
      'infra/testing/webdriver/executeAsyncAndCatch.js',
      'infra/utils/log-helper.js',
      'packages/workbox-core/_private/logger.mjs',
      'packages/workbox-sw/_default.mjs',
      'packages/workbox-cli/src/lib/logger.js',
      'test/workbox-window/integration/test.js',
      'test/workbox-window/unit/test-Workbox.mjs',
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
      'gulp-tasks/**/*.{mjs,js}',
      'infra/**/*.{mjs,js}',
      'packages/**/*.{mjs,js}',
      'test/**/*.{mjs,js}',
    ],
    plugins: [
      'header',
    ],
    rules: {
      'header/header': [2, 'block', {pattern: 'Copyright \\d{4} Google LLC'}]
    }
  }],
};
