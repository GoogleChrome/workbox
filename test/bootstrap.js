const glob = require('glob');
const TestRunner = require('../utils/test-runner');

const testGlob = `packages/${process.env.projectOrStar}/test/`;
const testFiles = glob.sync(testGlob);
const packageNames = testFiles.map((testFile) => {
  // Glob will return '/' as the path seperator regardless of
  // platform (i.e. it doesn't use '\' on windows).
  const packageName = testFile.split('/')[1];

  if (packageName === null) {
    throw new Error('Unable to get package name for: ', testFile);
  }

  return packageName;
});

console.log('process.env.projectOrStar: ', JSON.stringify(process.env.projectOrStar));
console.log('TestFiles: ', JSON.stringify(testFiles));
console.log('packageNames: ', JSON.stringify(packageNames));

const testRunner = new TestRunner(packageNames);
testRunner.start();
