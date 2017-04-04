const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');

const errors = require('../src/lib/errors');
const swBuild = require('../build/index.js');

describe('Test Injection Manifest', function() {
  let tmpDirectory;

  before(function() {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );
  });

  after(function() {
    fsExtra.removeSync(tmpDirectory);
  });

  const VALID_INJECTION_DOCS = [
    'ok-1.js',
    'ok-2.js',
    'ok-3.js',
    'ok-4.js',
  ];
  const expectedString = `swlib.cacheRevisionedAssets([
  {
    "url": "/index.css",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  },
  {
    "url": "/index.html",
    "revision": "d41d8cd98f00b204e9800998ecf8427e"
  }
])`;
  VALID_INJECTION_DOCS.forEach((docName) => {
    it(`should be able to read and inject in doc ${docName}`, function() {
      return swBuild.injectManifest({
        dest: tmpDirectory,
        rootDirectory: path.join(__dirname, 'static', 'injection-samples'),
        staticFileGlobs: ['**\/*.{html,css}'],
        swFile: docName,
      })
      .then(() => {
        const fileOutput =
          fs.readFileSync(path.join(tmpDirectory, docName)).toString();
        if (fileOutput.indexOf(expectedString) === -1) {
          console.log('DocName: ' + docName);
          console.log('fileOutput: ' + fileOutput);
          throw new Error('Could not find the expected output from injection of manifest.');
        }
      });
    });
  });

  const INVALID_INJECTION_DOCS = [
    'bad-1.js',
  ];
  INVALID_INJECTION_DOCS.forEach((docName) => {
    it(`should throw due to no injection point in ${docName}`, function() {
      return swBuild.injectManifest({
        dest: tmpDirectory,
        rootDirectory: path.join(__dirname, 'static', 'injection-samples'),
        staticFileGlobs: ['**\/*.{html,css}'],
        swFile: docName,
      })
      .then(() => {
        throw new Error('Expected promise to reject.');
      })
      .catch((err) => {
        if (err.message !== errors['injection-point-not-found']) {
          console.log(err);
          throw new Error('Unexpected error thrown.');
        }
      });
    });
  });
});
