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
  },
  rules: {
  },
  overrides: [{
    files: ['packages/*/test/**/*.js'],
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
      'gulp-tasks/utils/log-helper.js',
      'packages/workbox-core/src/utils/LogHelper.js',
      'packages/workbox-core/test/bundle/node/utils/test-LogHelper.js',
    ],
    rules: {
      'no-console': 0,
    },
  }, {
    files: ['gulp-tasks/**/*.js'],
    rules: {
      'valid-jsdoc': 0,
      'require-jsdoc': 0,
    },
  }, {
    files: [
      'infra/utils/generate-variant-tests.js'
    ],
    env: {
      'mocha': true
    }
  }],
};
