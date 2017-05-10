const path = require('path');

const swBuild = require('../../src/index.js');
const errors = require('../../src/lib/errors');

require('chai').should();

describe('Test getFileManifestEntries', function() {
  const EXAMPLE_INPUT = {
    staticFileGlobs: ['./**/*.{html,css}'],
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
        })
        .catch((err) => {
          if (err.message !== errors['invalid-glob-directory']) {
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
      globDirectory: path.join(__dirname, '..', '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.deep.equal([
        {
          url: '/index.html',
          revision: '24abd5daf6d87c25f40c2b74ee3fbe93',
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
      globDirectory: path.join(__dirname, '..', '..', '..',
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
          revision: '24abd5daf6d87c25f40c2b74ee3fbe93',
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

  it('should return file entries matching custom max file size', function() {
    const testInput = {
      staticFileGlobs: [
        '**/*.{html,js,css,jpg,png}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
      maximumFileSizeToCacheInBytes: 2000,
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.deep.equal([
        {
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

  it('should handle an invalid templatedUrl', function() {
    const testInput = {
      staticFileGlobs: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
      templatedUrls: {
        '/template/url1': ['/doesnt-exist/page-1.html', 'index.html'],
        '/template/url2': ['page-2.html', 'index.html'],
      },
    };

    try {
      swBuild.getFileManifestEntries(testInput);
      throw new Error('Should have thrown an error due to back input.');
    } catch (err) {
      // This error is made up of several pieces that are useful to the
      // developer. These checks ensure the relevant message is should with
      // relevant details called out.
      err.message.indexOf(errors['bad-template-urls-asset']).should.not.equal(-1);
      err.message.indexOf('/template/url1').should.not.equal(-1);
      err.message.indexOf('/doesnt-exist/page-1.html').should.not.equal(-1);
    }
  });

  it('should return file entries from example project with templatedUrls', function() {
    const testInput = {
      staticFileGlobs: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
      templatedUrls: {
        '/template/url1': ['page-1.html', 'index.html'],
        '/template/url2': ['page-2.html', 'index.html'],
        '/template/url3': '<html><head></head><body><p>Just in case</p></body></html>',
      },
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.deep.equal([
        {
          url: '/index.html',
          revision: '24abd5daf6d87c25f40c2b74ee3fbe93',
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
        }, {
          url: '/template/url1',
          revision: 'a505dfb0ac2cad8933ec437dd97ccc66',
        }, {
          url: '/template/url2',
          revision: 'bd9ef0ab8b57d5d716e6916610d34936',
        }, {
          url: '/template/url3',
          revision: '538954a0f0fca1d067ff03dca8dce79e',
        },
      ]);
    });
  });

  it('should return file entries from example project with dynamicUrlToDependencies', function() {
    const testInput = {
      staticFileGlobs: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
      dynamicUrlToDependencies: {
        '/template/url1': ['page-1.html', 'index.html'],
        '/template/url2': ['page-2.html', 'index.html'],
        '/template/url3': '<html><head></head><body><p>Just in case</p></body></html>',
      },
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.deep.equal([
        {
          url: '/index.html',
          revision: '24abd5daf6d87c25f40c2b74ee3fbe93',
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
        }, {
          url: '/template/url1',
          revision: 'a505dfb0ac2cad8933ec437dd97ccc66',
        }, {
          url: '/template/url2',
          revision: 'bd9ef0ab8b57d5d716e6916610d34936',
        }, {
          url: '/template/url3',
          revision: '538954a0f0fca1d067ff03dca8dce79e',
        },
      ]);
    });
  });

  it('should return file entries from example project without cache busting', function() {
    const testInput = {
      staticFileGlobs: [
        '**/*.{html,js,css}',
      ],
      globDirectory: path.join(__dirname, '..', '..', '..',
        'sw-cli', 'test', 'static', 'example-project-1'),
      dontCacheBustUrlsMatching: /./,
    };

    return swBuild.getFileManifestEntries(testInput)
    .then((output) => {
      output.should.deep.equal([
        '/index.html',
        '/page-1.html',
        '/page-2.html',
        '/styles/stylesheet-1.css',
        '/styles/stylesheet-2.css',
      ]);
    });
  });
});
