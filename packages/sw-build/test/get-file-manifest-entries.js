const proxyquire = require('proxyquire');

const swBuild = require('../src/index.js');
const errors = require('../src/lib/errors');

describe('Test getFileManifestEntries', function() {
  const EXAMPLE_INPUT = {
    staticFileGlobs: ['./**/*.{html,css}'],
    globIgnores: [],
    rootDirectory: '.',
  };

  it('should be able to handle bad input', function() {
    const badInputs = [
      undefined,
      null,
      '',
      [],
      true,
      false,
    ];
    badInputs.forEach((badInput) => {
      try {
        swBuild.getFileManifestEntries(badInput);
        throw new Error('Expected error to be thrown.');
      } catch (err) {
        if (err.message !== errors['invalid-get-manifest-entries-input']) {
          throw new Error('Unexpected error: ' + err.message);
        }
      }
    });
  });

  it('should detect bad rootDirectory', function() {
    const badInput = [
      undefined,
      null,
      '',
      [],
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.rootDirectory = input;
        return swBuild.getFileManifestEntries(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-root-directory']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it('should detect bad staticFileGlobs', function() {
    const badInput = [
      undefined,
      null,
      '',
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.staticFileGlobs = input;
        return swBuild.getFileManifestEntries(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        })
        .catch((err) => {
          if (err.message !== errors['invalid-static-file-globs']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it('should return file entries through each phase', function() {
    const testInput = {
      staticFileGlobs: [
        './glob-1',
        './glob-2',
      ],
      globIgnores: [
        './glob-ignore-1',
        './glob-ignore-2',
      ],
      rootDirectory: '.',
    };
    const FILE_ENTRIES = [{
      file: './glob-entry-1',
      hash: '1234',
      size: 1,
    }, {
      file: './glob-entry-2',
      hash: '4321',
      size: 2,
    }];
    const getFileManifestEntries = proxyquire(
      '../src/lib/get-file-manifest-entries.js', {
        './utils/get-file-details': (rootDirectory, globPattern, globIgnores) => {
          if (globIgnores !== testInput.globIgnores) {
            throw new Error('Invalid glob ignores value.');
          }

          if (rootDirectory !== testInput.rootDirectory) {
            throw new Error('Invalid rootDirectory value.');
          }

          if (testInput.staticFileGlobs.indexOf(globPattern) === -1) {
            throw new Error('Invalid glob pattern.');
          }

          return FILE_ENTRIES;
        },
        './utils/filter-files': (entries) =>{
          entries.forEach((entry) => {
            let matchingOracle = null;
            FILE_ENTRIES.forEach((oracleEntry) => {
              if (entry.file === oracleEntry.file) {
                matchingOracle = oracleEntry;
              }
            });
            if (!matchingOracle || entry.hash !== matchingOracle.hash || entry.size !== matchingOracle.size) {
              throw new Error('Could not find matching file entry.');
            }
          });

          if (entries.length !== FILE_ENTRIES.length) {
            throw new Error('Unexpected file entries - should have duplicates removed.');
          }
          return entries;
        },
      }
    );
    const output = getFileManifestEntries(testInput);
    output.forEach((entry) => {
      let matchingOracle = null;
      FILE_ENTRIES.forEach((oracleEntry) => {
        if (entry.file === oracleEntry.file) {
          matchingOracle = oracleEntry;
        }
      });
      if (!matchingOracle || entry.hash !== matchingOracle.hash || entry.size !== matchingOracle.size) {
        throw new Error('Could not find matching file entry.');
      }
    });
  });
});
