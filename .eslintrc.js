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
    'google': false,
  },
  rules: {
    "jsdoc/check-types": 2,
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
      'test/workbox-core/bundle/node/utils/test-LogHelper.js',
      'infra/testing/cli-test-helper.js',
      'infra/utils/log-helper.js',
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
      'infra/testing/generate-variant-tests.js',
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
  }],
};
