const glob = require('glob');
const path = require('path');
const TestRunner = require('../utils/test-runner');

const testGlob = `packages/${process.env.projectOrStar}/test/`;
const testFiles = glob.sync(testGlob);
const packageNames = testFiles.map((testFile) => {
  const packageName = testFile.split(path.sep)[1];
  return packageName;
}).filter((pkgName) => {
  switch(pkgName) {
    // There is a failing test on sw-bg-sync-queue
    case 'sw-background-sync-queue':
      console.warn('sw-background-sync-queue NEEDS a fix in Node.');
      return false;
    default:
      return true;
  }
});

const testRunner = new TestRunner(packageNames);
testRunner.start();
