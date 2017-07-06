const path = require('path');

const swBuild = require('../../src/index.js');
const errors = require('../../src/lib/errors');

require('chai').should();

describe('Test getFileManifestEntries', function() {
  const EXAMPLE_INPUT = {
    globPatterns: ['./**/*.{html,css}'],
    globIgnores: [],
    globDirectory: '.',
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
    return badInputs.reduce((promiseChain, input) => {
      return promiseChain.then(() => {
        return swBuild.getFileManifestEntries(input)
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

  it('should detect bad globDirectory', function() {
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
        return swBuild.getFileManifestEntries(args)
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

  it('should detect bad globPatterns', function() {
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
        args.globPatterns = input;
        return swBuild.getFileManifestEntries(args)
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

  for (const parameterVariation of ['globPatterns', 'staticFileGlobs']) {
    it(`should return file entries from example project using ${parameterVariation}`, function() {
      const testInput = {
        globDirectory: path.join(__dirname, '..', '..', '..',
          'workbox-cli', 'test', 'static', 'example-project-1'),
      };

      testInput[parameterVariation] = ['**/*.{html,js,css}'];

      return swBuild.getFileManifestEntries(testInput)
        .then((output) => {
          const allUrls = output.map((entry) => {
            return entry.url;
          });
          allUrls.should.deep.equal([
            'index.html',
            'page-1.html',
            'page-2.html',
            'styles/stylesheet-1.css',
            'styles/stylesheet-2.css',
            'webpackEntry.js',
          ]);
        });
    });
  }

  it('should return file entries from example project with prefix', function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
      modifyUrlPrefix: {
        'styles': 'static/styles',
        'page': 'pages/page',
      },
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      const allUrls = output.map((entry) => {
        return entry.url;
      });
      allUrls.should.deep.equal([
        'index.html',
        'pages/page-1.html',
        'pages/page-2.html',
        'static/styles/stylesheet-1.css',
        'static/styles/stylesheet-2.css',
        'webpackEntry.js',
      ]);
    });
  });

  it('should return file entries matching custom max file size', function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css,jpg,png}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
      maximumFileSizeToCacheInBytes: 2000,
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      const allUrls = output.map((entry) => {
        return entry.url;
      });
      allUrls.should.deep.equal([
        'page-1.html',
        'page-2.html',
        'styles/stylesheet-1.css',
        'styles/stylesheet-2.css',
        'webpackEntry.js',
      ]);
    });
  });

  it('should handle an invalid templatedUrl', function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
      templatedUrls: {
        '/template/url1': ['/doesnt-exist/page-1.html', 'index.html'],
        '/template/url2': ['page-2.html', 'index.html'],
      },
    };

    return swBuild.getFileManifestEntries(testInput)
    .then(() => {
      throw new Error('Should have thrown an error due to bad input.');
    }, (err) => {
      // This error is made up of several pieces that are useful to the
      // developer. These checks ensure the relevant message is should with
      // relevant details called out.
      err.message.indexOf(errors['bad-template-urls-asset']).should.not.equal(-1);
      err.message.indexOf('/template/url1').should.not.equal(-1);
      err.message.indexOf('/doesnt-exist/page-1.html').should.not.equal(-1);
    });
  });

  it('should return file entries from example project with templatedUrls', function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
      templatedUrls: {
        '/template/url1': ['page-1.html', 'index.html'],
        'template/url2': ['page-2.html', 'index.html'],
        '/template/url3': '<html><head></head><body><p>Just in case</p></body></html>',
      },
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      const allUrls = output.map((entry) => {
        return entry.url;
      });
      allUrls.should.deep.equal([
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

  it('should return file entries from example project with dynamicUrlToDependencies', function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
      dynamicUrlToDependencies: {
        '/template/url1': ['page-1.html', 'index.html'],
        'template/url2': ['page-2.html', 'index.html'],
        '/template/url3': '<html><head></head><body><p>Just in case</p></body></html>',
      },
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      const allUrls = output.map((entry) => {
        return entry.url;
      });
      allUrls.should.deep.equal([
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

  it('should return file entries from example project without cache busting', function() {
    const testInput = {
      globPatterns: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
      dontCacheBustUrlsMatching: /./,
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.eql([
        {url: 'index.html'},
        {url: 'page-1.html'},
        {url: 'page-2.html'},
        {url: 'styles/stylesheet-1.css'},
        {url: 'styles/stylesheet-2.css'},
        {url: 'webpackEntry.js'},
      ]);
    });
  });

  it(`should throw an error when both templatedUrls and dynamicUrlsToDependencies are used`, function() {
    const templatedUrlsValues = {
      '/template/url1': ['page-1.html', 'index.html'],
    };

    const badInput = {
      globPatterns: ['**/*.{html,js,css}'],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
      dynamicUrlToDependencies: templatedUrlsValues,
      templatedUrls: templatedUrlsValues,
    };

    return swBuild.getFileManifestEntries(badInput)
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      if (err.message !== errors['both-templated-urls-dynamic-urls']) {
        throw new Error('Unexpected error: ' + err.message);
      }
    });
  });

  it(`should throw an error when both globPatterns and staticFileGlobs are used`, function() {
    const globPatternsValue = ['**/*.{html,js,css}'];

    const badInput = {
      globPatterns: globPatternsValue,
      staticFileGlobs: globPatternsValue,
      globDirectory: path.join(__dirname, '..', '..', '..',
        'workbox-cli', 'test', 'static', 'example-project-1'),
    };

    return swBuild.getFileManifestEntries(badInput)
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      if (err.message !== errors['both-glob-patterns-static-file-globs']) {
        throw new Error('Unexpected error: ' + err.message);
      }
    });
  });
});
