const glob = require('glob');
const path = require('path');
const TestRunner = require('../utils/test-runner');

const testGlob = `packages/${process.env.projectOrStar}/test/`;
const testFiles = glob.sync(testGlob);
const packageNames = testFiles.map((testFile) => {
  const packageName = testFile.split(path.sep)[1];
  return packageName;
});

console.log('process.env.projectOrStar: ', process.env.projectOrStar);
console.log('packageNames: ', packageNames);

const testRunner = new TestRunner(packageNames);
testRunner.start();
