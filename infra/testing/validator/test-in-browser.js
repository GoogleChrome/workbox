const fs = require('fs');
const logHelper = require('../log-helper');
const path = require('path');
const querystring = require('querystring');
const seleniumAssistant = require('selenium-assistant');
const url = require('url');

const getSeleniumBrowser = () => {
  if (process.platform !== 'win32') {
    logHelper.log('Running in local Chrome stable.');
    return Promise.resolve(
      seleniumAssistant.getLocalBrowser('chrome', 'stable')
    );
  }

  if (!process.env['SAUCELABS_USERNAME'] ||
    !process.env['SAUCELABS_ACCESS_KEY']) {
    logHelper.warn('Skipping SauceLabs tests due to no credentials in environment');
    return Promise.resolve(null);
  }

  logHelper.log('Running in a windows Windows Environment, using SauceLabs.');

  const SAUCELABS_USERNAME = process.env['SAUCELABS_USERNAME'];
  const SAUCELABS_ACCESS_KEY = process.env['SAUCELABS_ACCESS_KEY'];
  seleniumAssistant.setSaucelabsDetails(SAUCELABS_USERNAME, SAUCELABS_ACCESS_KEY);
  return seleniumAssistant.startSaucelabsConnect()
  .then(() => {
    return seleniumAssistant.getSauceLabsBrowser('chrome', 'latest');
  });
};

const testInBrowser = (baseTestUrl, fileManifestOutput, swDest, exampleProject, modifyUrlPrefix) => {
  return getSeleniumBrowser()
  .then((assistantBrowser) => {
    if (!assistantBrowser) {
      return Promise.resolve();
    }

    let globalDriver;

    const performCleanup = (err) => {
      if (err) {
        logHelper.error(err);
      }
      logHelper.log('Performing cleanup of selenium browser...');
      return seleniumAssistant.stopSaucelabsConnect()
      .then(() => {
        if (!globalDriver) {
          return;
        }

        return seleniumAssistant.killWebDriver(globalDriver);
      })
      .catch(() => {})
      .then(() => {
        if (err) {
          return Promise.reject(err);
        }

        return Promise.resolve();
      });
    };

    logHelper.log('Getting selenium driver....');
    return assistantBrowser.getSeleniumDriver()
    .then((browserDriver) => {
      globalDriver = browserDriver;
    })
    .then(() => {
      const urlFriendlyDest = querystring.escape(swDest);
      logHelper.log(`Opening URL in browser: ${baseTestUrl}/index.html?sw=${urlFriendlyDest}`);
      return globalDriver.get(`${baseTestUrl}/index.html?sw=${urlFriendlyDest}`);
    })
    .then(() => {
      logHelper.log('Waiting for browser to have window.__testresult set....');
      return globalDriver.wait(() => {
        return globalDriver.executeScript(() => {
          return typeof window.__testresult !== 'undefined';
        });
      });
    })
    .then(() => {
      logHelper.log('Getting window.__testresult from browser....');
      return globalDriver.executeScript(() => {
        return window.__testresult;
      });
    })
    .then((testResult) => {
      logHelper.log('Retrieved test results from the browser...');
      if (!testResult.entries) {
          throw new Error(`Bad test results from mocha: '${JSON.stringify(testResult)}'`);
        }

        const entries = testResult.entries;
        entries.length.should.equal(fileManifestOutput.length);

        const pathnames = entries.map((entry) => {
          return url.parse(entry).pathname;
        });

        fileManifestOutput.forEach((details) => {
          let correctedURL = details.url;
          try {
            if (modifyUrlPrefix && Object.keys(modifyUrlPrefix).length > 0) {
              Object.keys(modifyUrlPrefix).forEach((key) => {
                const value = modifyUrlPrefix[key];
                correctedURL = correctedURL.replace(value, key);
              });
            }
            let filePath = path.join(exampleProject, correctedURL);
            fs.statSync(filePath);
          } catch (err) {
            throw new Error(`The path '${details.url}' from the manifest doesn't seem valid.`);
          }
          const expectedFileIndex = pathnames.indexOf(`/${correctedURL}`);
          if (expectedFileIndex === -1) {
            logHelper.log(pathnames);
            logHelper.log(entries);
            logHelper.log('Problem file: ', details.url);
            throw new Error(`Unexpected file in manifest (2): '${details.url}'`);
          }

          pathnames.splice(expectedFileIndex, 1);

          (typeof details.revision).should.equal('string');
          details.revision.length.should.be.gt(0);
        });

        pathnames.length.should.equal(0);
    })
    .then(performCleanup, performCleanup);
  });
};

module.exports = testInBrowser;
