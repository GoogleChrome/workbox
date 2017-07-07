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
    WorkboxSW: false,
    workbox: false,
  },
  rules: {
    'no-tabs': 2,
    'linebreak-style': 0,
    'space-before-function-paren': ['error', {
      asyncArrow: 'always',
      anonymous: 'never',
      named: 'never',
    }],
  },
  overrides: [{
    files: ['**/test/**/*.js', '**/test.js'],
    env: {
      mocha: true,
    },
    globals: {
      expect: true,
      sinon: true,
      goog: true,
    },
    rules: {
      'no-console': 0,
      'valid-jsdoc': 0,
      'require-jsdoc': 0,
      'max-len': 0,
      'no-invalid-this': 0,
    },
  }],
};
