const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const glob = require('glob');
const fse = require('fs-extra');
const expect = require('chai').expect;
const url = require('url');
const seleniumAssistant = require('selenium-assistant');
const testServer = require('../../../utils/test-server.js');

require('chai').should();

describe('Test Example Projects', function() {
  let tmpDirectory;
  let globalDriverBrowser;
  let baseTestUrl;

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

    fse.removeSync(tmpDirectory);

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

  it('should be able to generate a service for example-1', function() {
    this.timeout(60 * 1000);

    fse.copySync(
      path.join(__dirname, 'example-projects', 'example-1'),
      tmpDirectory);

    const exampleProject = tmpDirectory;
    const relativeProjPath = path.relative(process.cwd(), exampleProject);

    // NOTE: No JPG
    const fileExntensions = ['html', 'css', 'js', 'png'];

    const manifestName = `${Date.now()}-manifest.js`;
    const swName = `${Date.now()}-sw.js`;

    const SWCli = proxyquire('../build/cli/index', {
      inquirer: {
        prompt: (questions) => {
          switch (questions[0].name) {
            case 'rootDir':
              return Promise.resolve({
                rootDir: relativeProjPath,
              });
            case 'cacheExtensions':
              return Promise.resolve({
                cacheExtensions: fileExntensions,
              });
            case 'fileManifestName':
              return Promise.resolve({
                fileManifestName: manifestName,
              });
            case 'serviceWorkerName':
              return Promise.resolve({
                serviceWorkerName: swName,
              });
            case 'saveConfig':
              return Promise.resolve({
                saveConfig: false,
              });
            default:
              console.error('');
              console.error(`Unknown question: ${questions[0].name}`);
              console.error('');
              return Promise.reject();
          }
        },
      },
    });

    let fileManifestOutput;

    const cli = new SWCli();
    return cli.handleCommand('generate-sw')
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

      const swlibPkg = require(
        path.join(__dirname, '..', 'node_modules', 'sw-lib', 'package.json'));

      // Check the files that we expect to be defined are.
      let expectedFiles = glob.sync(
        `${exampleProject}/**/*.{${fileExntensions.join(',')}}`, {
        ignore: [
          `${exampleProject}/${manifestName}`,
          `${exampleProject}/${swName}`,
          `${exampleProject}/sw-lib.v${swlibPkg.version}.min.js`,
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
      return cli.handleCommand('generate-sw');
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
      fileManifestOutput.forEach((manifestEntry) => {
        if (manifestEntry.url === `/${manifestName}`) {
          throw new Error('The manifest itself was not excluded from the generated file manifest.');
        }
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

      return assistantBrowser.getSeleniumDriver()
      .then((browserDriver) => {
        globalDriverBrowser = browserDriver;
        return browserDriver.get(`${baseTestUrl}/index.html?sw=${swName}`);
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
  });
});
