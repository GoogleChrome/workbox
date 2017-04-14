const fs = require('fs');
const expect = require('chai').expect;
const url = require('url');
const vm = require('vm');
const glob = require('glob');
const path = require('path');
const seleniumAssistant = require('selenium-assistant');

/* eslint-disable require-jsdoc */

let globalDriverBrowser;

const performCleanup = (err) => {
  return seleniumAssistant.stopSaucelabsConnect()
  .then(() => {
    if (!globalDriverBrowser) {
      return;
    }

    return seleniumAssistant.killWebDriver(globalDriverBrowser)
    .then(() => {
      globalDriverBrowser = null;
    });
  })
  .catch(() => {})
  .then(() => {
    if (err) {
      return Promise.reject(err);
    }

    return Promise.resolve();
  });
};

const performTest = (generateSWCb, {exampleProject, swName, fileExtensions, baseTestUrl}) => {
  let fileManifestOutput;
  return generateSWCb()
  .then(() => {
    class SWLib {
      precache(fileManifest) {
        fileManifestOutput = fileManifest;
      }
    }
    const injectedSelf = {
      goog: {
        SWLib,
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
      `${exampleProject}/**/*.{${fileExtensions.join(',')}}`, {
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
    class SWLib {
      precache(fileManifest) {
        fileManifestOutput = fileManifest;
      }
    }

    const injectedSelf = {
      goog: {
        SWLib,
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
        throw new Error('Bad test results from mocha: ' + JSON.stringify(testResult));
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
  })
  .then(performCleanup, performCleanup);
};


module.exports = {
  performTest: performTest,
};
