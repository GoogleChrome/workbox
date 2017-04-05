const path = require('path');

const swBuild = require('../src/index.js');
const errors = require('../src/lib/errors');

require('chai').should();

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

  it('should return file entries from example project', function() {
    const testInput = {
      staticFileGlobs: [
        '**/*.{html,js,css}',
      ],
      rootDirectory: path.join(__dirname, '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.deep.equal([
        {
          url: '/index.html',
          revision: '218c18c2a07f6fbe326de4c9b0676164',
        }, {
          url: '/page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: '/page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: '/styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: '/styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        },
      ]);
    });
  });

  it('should return file entries from example project with prefix', function() {
    const testInput = {
      staticFileGlobs: [
        '**/*.{html,js,css}',
      ],
      rootDirectory: path.join(__dirname, '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
      modifyUrlPrefix: {
        '/styles': '/static/styles',
        '/page': '/pages/page',
      },
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.deep.equal([
        {
          url: '/index.html',
          revision: '218c18c2a07f6fbe326de4c9b0676164',
        }, {
          url: '/pages/page-1.html',
          revision: '544658ab25ee8762dc241e8b1c5ed96d',
        }, {
          url: '/pages/page-2.html',
          revision: 'a3a71ce0b9b43c459cf58bd37e911b74',
        }, {
          url: '/static/styles/stylesheet-1.css',
          revision: '934823cbc67ccf0d67aa2a2eeb798f12',
        }, {
          url: '/static/styles/stylesheet-2.css',
          revision: '884f6853a4fc655e4c2dc0c0f27a227c',
        },
      ]);
    });
  });
});
