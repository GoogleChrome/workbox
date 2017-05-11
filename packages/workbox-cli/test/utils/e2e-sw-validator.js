const fs = require('fs');
const expect = require('chai').expect;
const url = require('url');
const vm = require('vm');
const glob = require('glob');
const path = require('path');
const querystring = require('querystring');
const seleniumAssistant = require('selenium-assistant');

/* eslint-disable require-jsdoc */

let globalDriverBrowser;

const validateFiles = (fileManifestOutput, exampleProject, fileExtensions, swDest, modifyUrlPrefix) => {
  // Check the manifest is defined by the manifest JS.
  expect(fileManifestOutput).to.exist;

  // Check the files that we expect to be defined are.
  let expectedFiles = glob.sync(
    `${exampleProject}/**/*.{${fileExtensions.join(',')}}`, {
    ignore: [
      path.join(exampleProject, swDest),
      path.join(exampleProject, path.dirname(swDest), 'workbox-sw.prod.*.js'),
    ],
  });

  expectedFiles = expectedFiles.map((file) => {
    return `/${path.relative(exampleProject, file).replace(path.sep, '/')}`;
  });

  if (fileManifestOutput.length !== expectedFiles.length) {
    console.error('File Manifest: ', fileManifestOutput);
    console.error('Globbed Files: ', expectedFiles);

    throw new Error('File manifest and glob lengths are different.');
  }

  fileManifestOutput.forEach((fileManifestEntryDetails) => {
    let correctedURL = fileManifestEntryDetails.url;
    try {
      let filePath = path.join(exampleProject, fileManifestEntryDetails.url);
      if (modifyUrlPrefix && Object.keys(modifyUrlPrefix).length > 0) {
        Object.keys(modifyUrlPrefix).forEach((key) => {
          const value = modifyUrlPrefix[key];
          filePath = filePath.replace(value, key);
          correctedURL = correctedURL.replace(value, key);
        });
      }
      fs.statSync(filePath);
    } catch (err) {
      console.error(err);
      throw new Error(`The path '${fileManifestEntryDetails.url}' from the manifest doesn't seem valid.`);
    }

    const expectedFileIndex = expectedFiles.indexOf(correctedURL);
    if (expectedFileIndex === -1) {
      console.log('MANIFEST FILES: ', fileManifestOutput);
      console.log('EXPECTED FILES: ', expectedFiles);
      throw new Error(`Unexpected file in manifest (1): '${fileManifestEntryDetails.url}'`);
    }

    expectedFiles.splice(expectedFileIndex, 1);

    (typeof fileManifestEntryDetails.revision).should.equal('string');
    fileManifestEntryDetails.revision.length.should.be.gt(0);
  });

  expectedFiles.length.should.equal(0);
};

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

const performTest = (generateSWCb, {exampleProject, swDest, fileExtensions, baseTestUrl, modifyUrlPrefix}) => {
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
    const swContent = fs.readFileSync(swDest);
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

    validateFiles(fileManifestOutput, exampleProject, fileExtensions, swDest, modifyUrlPrefix);
  })
  .then(() => {
    // Rerun and ensure the sw and workbox-sw files are excluded from the output.
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
    const swContent = fs.readFileSync(swDest);
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

    validateFiles(fileManifestOutput, exampleProject, fileExtensions, swDest, modifyUrlPrefix);
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
      const urlFriendlyDest = querystring.escape(swDest);
      console.log(`URL: ${baseTestUrl}/index.html?sw=${urlFriendlyDest}`);
      return globalDriverBrowser.get(`${baseTestUrl}/index.html?sw=${urlFriendlyDest}`);
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
          console.log(entries);
          console.log('Problem file: ', details.url);
          throw new Error(`Unexpected file in manifest (2): '${details.url}'`);
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
