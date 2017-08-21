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
  },
  overrides: [{
    files: ['test/**/*.js'],
    env: {
      mocha: true,
    },
    rules: {
      'valid-jsdoc': 0,
      'require-jsdoc': 0,
      'max-len': 0,
    },
  }, {
    files: [
      'packages/workbox-core/src/utils/LogHelper.js',
      'test/workbox-core/bundle/node/utils/test-LogHelper.js',
      'gulp-tasks/utils/log-helper.js',
      'infra/tools/analyse-properties.js',
    ],
    rules: {
      'no-console': 0,
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
      'infra/utils/generate-variant-tests.js',
    ],
    env: {
      'mocha': true
    }
  }],
};
