const expect = require('chai').expect;
const path = require('path');
const proxyquire = require('proxyquire');

const workboxBuild = require('../../../packages/workbox-build/src/index.js');
const errors = require('../../../packages/workbox-build/src/lib/errors');
const constants = require('../../../packages/workbox-build/src/lib/constants');

describe(`Test getFileManifestEntries`, function() {
  const EXAMPLE_INPUT = {
    globPatterns: ['./**/*.{html,css}'],
    globIgnores: [],
    globDirectory: '.',
  };

  it(`should be able to handle bad input`, function() {
    const badInputs = [
      undefined,
      null,
      '',
      [],
      true,
      false,
    ];
    return badInputs.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        return workboxBuild.getFileManifestEntries(input)
        .then(() => {
          throw new Error('Expected to throw error.');
        }, (err) => {
          if (err.message !== errors['invalid-get-manifest-entries-input']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it(`should detect bad globDirectory`, function() {
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
        args.globDirectory = input;
        return workboxBuild.getFileManifestEntries(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        }, (err) => {
          if (err.message !== errors['invalid-glob-directory']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it(`should detect bad globPatterns`, function() {
    const badInput = [
      null,
      '',
      true,
      false,
    ];
    return badInput.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        let args = Object.assign({}, EXAMPLE_INPUT);
        args.globPatterns = input;
        return workboxBuild.getFileManifestEntries(args)
        .then(() => {
          throw new Error('Expected to throw error.');
        }, (err) => {
          if (err.message !== errors['invalid-static-file-globs']) {
            throw new Error('Unexpected error: ' + err.message);
          }
        });
      });
    }, Promise.resolve());
  });

  it(`should use defaults for undefined globPatterns`, function() {
    let args = Object.assign({}, EXAMPLE_INPUT);
    delete args.globPatterns;

    return new Promise((resolve, reject) => {
      const proxiedGetFileManifestEntries = proxyquire('../../../packages/workbox-build/src/lib/get-file-manifest-entries.js', {
        './utils/get-file-details': (globDirectory, globPattern, globIgnores) => {
          if (globPattern === constants.defaultGlobPatterns[0]) {
            resolve();
            return;
          }
          reject(`Unexpected globPattern: ${JSON.stringify(globPattern)}`);
        },
      });

      proxiedGetFileManifestEntries(args);
    });
  });

  it(`should return file entries from example project using globPatterns`, function() {
    const testInput = {
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
      globPatterns: ['**/*.{html,js,css}'],
    };

    return workboxBuild.getFileManifestEntries(testInput)
      .then((output) => {
        const allUrls = output.map((entry) => {
          return entry.url;
        });
        expect(allUrls).to.deep.equal([
          'index.html',
          'page-1.html',
          'page-2.html',
          'styles/stylesheet-1.css',
          'styles/stylesheet-2.css',
          'webpackEntry.js',
        ]);
      });
  });

  it(`should return file entries from example project with prefix`, function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
      modifyUrlPrefix: {
        'styles': 'static/styles',
        'page': 'pages/page',
      },
    };

    return workboxBuild.getFileManifestEntries(testInput)
    .then((output) => {
      const allUrls = output.map((entry) => {
        return entry.url;
      });
      expect(allUrls).to.deep.equal([
        'index.html',
        'pages/page-1.html',
        'pages/page-2.html',
        'static/styles/stylesheet-1.css',
        'static/styles/stylesheet-2.css',
        'webpackEntry.js',
      ]);
    });
  });

  it(`should return file entries matching custom max file size`, function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css,jpg,png}',
      ],
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
      maximumFileSizeToCacheInBytes: 2000,
    };

    return workboxBuild.getFileManifestEntries(testInput)
    .then((output) => {
      const allUrls = output.map((entry) => {
        return entry.url;
      });
      expect(allUrls).to.deep.equal([
        'page-1.html',
        'page-2.html',
        'styles/stylesheet-1.css',
        'styles/stylesheet-2.css',
        'webpackEntry.js',
      ]);
    });
  });

  it(`should handle an invalid templatedUrl`, function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
      templatedUrls: {
        '/template/url1': ['/doesnt-exist/page-1.html', 'index.html'],
        '/template/url2': ['page-2.html', 'index.html'],
      },
    };

    return workboxBuild.getFileManifestEntries(testInput)
    .then(() => {
      throw new Error('Should have thrown an error due to bad input.');
    }, (err) => {
      // This error is made up of several pieces that are useful to the
      // developer. These checks ensure the relevant message is should with
      // relevant details called out.
      expect(err.message.indexOf(errors['bad-template-urls-asset'])).to.not.equal(-1);
      expect(err.message.indexOf('/template/url1')).to.not.equal(-1);
      expect(err.message.indexOf('/doesnt-exist/page-1.html')).to.not.equal(-1);
    });
  });

  it(`should return file entries from example project with templatedUrls`, function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
      templatedUrls: {
        '/template/url1': ['page-1.html', 'index.html'],
        'template/url2': ['page-2.html', 'index.html'],
        '/template/url3': '<html><head></head><body><p>Just in case</p></body></html>',
      },
    };

    return workboxBuild.getFileManifestEntries(testInput)
    .then((output) => {
      const allUrls = output.map((entry) => {
        return entry.url;
      });
      expect(allUrls).to.deep.equal([
        'index.html',
        'page-1.html',
        'page-2.html',
        'styles/stylesheet-1.css',
        'styles/stylesheet-2.css',
        'webpackEntry.js',
        '/template/url1',
        'template/url2',
        '/template/url3',
      ]);
    });
  });

  it(`should return file entries from example project without cache busting`, function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
      dontCacheBustUrlsMatching: /./,
    };

    return workboxBuild.getFileManifestEntries(testInput)
    .then((output) => {
      expect(output).to.eql([
        {url: 'index.html'},
        {url: 'page-1.html'},
        {url: 'page-2.html'},
        {url: 'styles/stylesheet-1.css'},
        {url: 'styles/stylesheet-2.css'},
        {url: 'webpackEntry.js'},
      ]);
    });
  });

  it(`should throw an error when dynamicUrlToDependencies is used`, async function() {
    const badInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
      dynamicUrlToDependencies: {
        '/template/url1': ['page-1.html', 'index.html'],
        'template/url2': ['page-2.html', 'index.html'],
        '/template/url3': '<html><head></head><body><p>Just in case</p></body></html>',
      },
    };

    try {
      await workboxBuild.getFileManifestEntries(badInput);
      throw new Error('Expected error to be thrown.');
    } catch (error) {
      expect(error.message).to.eql(errors['dynamic-url-deprecated']);
    }
  });

  it(`should throw an error when staticFileGlobs is used`, async function() {
    const badInput = {
      staticFileGlobs: ['**/*.{html,js,css}'],
      globDirectory: path.join(__dirname, '..', 'static', 'example-project-1'),
    };

    try {
      await workboxBuild.getFileManifestEntries(badInput);
      throw new Error('Expected error to be thrown.');
    } catch (error) {
      expect(error.message).to.eql(errors['static-file-globs-deprecated']);
    }
  });
});
