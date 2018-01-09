const gulp = require('gulp');

const lint = require('./lint');
const build = require('./build');
const testNode = require('./test-node');
const testIntegration = require('./test-integration');

const test = gulp.series(
  build,
  testNode,
  testIntegration,
  lint,
);
test.displayName = 'test';

module.exports = test;
