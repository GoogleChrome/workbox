const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const glob = require('glob');
const fsExtra = require('fs-extra');
const expect = require('chai').expect;
const url = require('url');
const seleniumAssistant = require('selenium-assistant');
const testServer = require('../../../utils/test-server.js');

require('chai').should();

describe('Generate SW End-to-End Tests', function() {
  let tmpDirectory;
  let globalDriverBrowser;
  let baseTestUrl;
  // NOTE: No JPG
  const FILE_EXTENSIONS = ['html', 'css', 'js', 'png'];

  // Kill the web server once all tests are complete.
  after(function() {
    return testServer.stop();
  });

  beforeEach(() => {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );

    return testServer.start(tmpDirectory)
    .then((portNumber) => {
      baseTestUrl = `http://localhost:${portNumber}`;
    });
  });

  afterEach(function() {
    this.timeout(10 * 1000);

    fsExtra.removeSync(tmpDirectory);

    return seleniumAssistant.stopSaucelabsConnect()
    .then(() => {
      if (!globalDriverBrowser) {
        return;
      }

      return seleniumAssistant.killWebDriver(globalDriverBrowser)
      .then(() => {
        globalDriverBrowser = null;
      });
    });
  });

  const performTest = (generateSWCb, {exampleProject, swName}) => {
    let fileManifestOutput;
    return generateSWCb()
    .then(() => {
      const injectedSelf = {
        goog: {
          swlib: {
            cacheRevisionedAssets: (fileManifest) => {
              fileManifestOutput = fileManifest;
            },
          },
        },
      };
      const swContent =
        fs.readFileSync(path.join(exampleProject, swName));
      // To smoke test the service worker is valid JavaScript we can run it
      // in Node's JavaScript parsed. `runInNewContext` comes without
      // any of the usual APIs (i.e. no require API, no console API, nothing)
      // so we inject a `self` API to emulate the service worker environment.
      vm.runInNewContext(swContent, {
        self: injectedSelf,
        importScripts: () => {
          // NOOP
        },
      });

      // Check the manifest is defined by the manifest JS.
      expect(fileManifestOutput).to.exist;

      // Check the files that we expect to be defined are.
      let expectedFiles = glob.sync(
        `${exampleProject}/**/*.{${FILE_EXTENSIONS.join(',')}}`, {
        ignore: [
          `${exampleProject}/${swName}`,
          `${exampleProject}/sw-lib.*.min.js`,
        ],
      });
      expectedFiles = expectedFiles.map((file) => {
        return `/${path.relative(exampleProject, file).replace(path.sep, '/')}`;
      });

      if (fileManifestOutput.length !== expectedFiles.length) {
        console.error('File Manifest: ', fileManifestOutput);
        console.error('Globbed Files: ', expectedFiles);

        throw new Error('File manifest and glob produced different values.');
      }

      fileManifestOutput.forEach((details) => {
        try {
          fs.statSync(path.join(exampleProject, details.url));
        } catch (err) {
          throw new Error(`The path '${details.url}' from the manifest doesn't seem valid.`);
        }

        const expectedFileIndex = expectedFiles.indexOf(details.url);
        if (expectedFileIndex === -1) {
          console.log(expectedFiles);
          throw new Error(`Unexpected file in manifest: '${details.url}'`);
        }

        expectedFiles.splice(expectedFileIndex, 1);

        (typeof details.revision).should.equal('string');
        details.revision.length.should.be.gt(0);
      });

      expectedFiles.length.should.equal(0);
    })
    .then(() => {
      // Rerun and ensure the sw and sw-lib files are excluded from the output.
      return generateSWCb();
    })
    .then(() => {
      const injectedSelf = {
        goog: {
          swlib: {
            cacheRevisionedAssets: (fileManifest) => {
              fileManifestOutput = fileManifest;
            },
          },
        },
      };
      const swContent =
        fs.readFileSync(path.join(exampleProject, swName));
      // To smoke test the service worker is valid JavaScript we can run it
      // in Node's JavaScript parsed. `runInNewContext` comes without
      // any of the usual APIs (i.e. no require API, no console API, nothing)
      // so we inject a `self` API to emulate the service worker environment.
      vm.runInNewContext(swContent, {
        self: injectedSelf,
        importScripts: () => {
          // NOOP
        },
      });
    })
    .then(() => {
      if (process.platform === 'win32') {
        if (!process.env['SAUCELABS_USERNAME'] ||
          !process.env['SAUCELABS_ACCESS_KEY']) {
          console.warn('Skipping SauceLabs tests due to no credentials in environment');
          return;
        }

        const SAUCELABS_USERNAME = process.env['SAUCELABS_USERNAME'];
        const SAUCELABS_ACCESS_KEY = process.env['SAUCELABS_ACCESS_KEY'];
        seleniumAssistant.setSaucelabsDetails(SAUCELABS_USERNAME, SAUCELABS_ACCESS_KEY);
        return seleniumAssistant.startSaucelabsConnect()
        .then(() => {
          return seleniumAssistant.getSauceLabsBrowser('chrome', 'latest');
        });
      } else {
        return seleniumAssistant.getLocalBrowser('chrome', 'stable');
      }
    })
    .then((assistantBrowser) => {
      if (!assistantBrowser) {
        return;
      }

      let getBrowserPromise = Promise.resolve();
      if (!globalDriverBrowser) {
        getBrowserPromise = assistantBrowser.getSeleniumDriver()
        .then((browserDriver) => {
          globalDriverBrowser = browserDriver;
        });
      }

      return getBrowserPromise.then(() => {
        return globalDriverBrowser.get(`${baseTestUrl}/index.html?sw=${swName}`);
      })
      .then(() => {
        return globalDriverBrowser.wait(() => {
          return globalDriverBrowser.executeScript(() => {
            return typeof window.__testresult !== 'undefined';
          });
        });
      })
      .then(() => {
        return globalDriverBrowser.executeScript(() => {
          return window.__testresult;
        });
      })
      .then((testResult) => {
        if (!testResult.entries) {
          throw new Error('Bad response: ' + JSON.stringify(testResult));
        }

        const entries = testResult.entries;
        entries.length.should.equal(fileManifestOutput.length);

        const pathnames = entries.map((entry) => {
          return url.parse(entry).pathname;
        });

        fileManifestOutput.forEach((details) => {
          try {
            fs.statSync(path.join(exampleProject, details.url));
          } catch (err) {
            throw new Error(`The path '${details.url}' from the manifest doesn't seem valid.`);
          }

          const expectedFileIndex = pathnames.indexOf(details.url);
          if (expectedFileIndex === -1) {
            console.log(pathnames);
            throw new Error(`Unexpected file in manifest: '${details.url}'`);
          }

          pathnames.splice(expectedFileIndex, 1);

          (typeof details.revision).should.equal('string');
          details.revision.length.should.be.gt(0);
        });

        pathnames.length.should.equal(0);
      });
    });
  };

  it('should be able to generate a service for example-1 with CLI', function() {
    this.timeout(120 * 1000);

    process.chdir(tmpDirectory);

    fsExtra.copySync(
      path.join(__dirname, 'static', 'example-project-1'),
      tmpDirectory);

    const swName = `${Date.now()}-sw.js`;

    let enforceNoQuestions = false;
    const SWCli = proxyquire('../build/index', {
      './lib/questions/ask-root-of-web-app': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(tmpDirectory);
      },
      './lib/questions/ask-sw-name': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(swName);
      },
      './lib/questions/ask-save-config': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(true);
      },
      './lib/questions/ask-extensions-to-cache': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(FILE_EXTENSIONS);
      },
    });

    const cli = new SWCli();
    return performTest(() => {
      return cli.handleCommand('generate-sw');
    }, {
      exampleProject: tmpDirectory,
      swName,
    })
    .then(() => {
      // Should be able to handle command with no questions
      enforceNoQuestions = true;
      return performTest(() => {
        return cli.handleCommand('generate-sw');
      }, {
        exampleProject: tmpDirectory,
        swName,
      });
    });
  });
});
