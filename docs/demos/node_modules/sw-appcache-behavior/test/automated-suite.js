/*
 Copyright 2016 Google Inc. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

'use strict';

/* eslint-env node, mocha, browser, serviceworker */
/* eslint-disable max-len, no-unused-expressions */

// These tests make use of selenium-webdriver. You can find the relevant
// documentation here: http://selenium.googlecode.com/git/docs/api/javascript/index.html

const chai = require('chai');
const parseManifest = require('parse-appcache-manifest');
const path = require('path');
const promisify = require('promisify-node');
const seleniumAssistant = require('selenium-assistant');
const fs = require('fs');
const testServer = require('../../../utils/test-server');

// Ensure the selenium drivers are added Node scripts path.
require('geckodriver');
require('chromedriver');
require('operadriver');

const fsePromise = promisify('fs-extra');

const expect = chai.expect;
const TIMEOUT = 10 * 1000;
const RETRIES = 3;
let tempDirectory = path.join(__dirname, 'end-to-end-caching', 'temp');

// Helper method to generate the text of an App Cache manifest with a
// specific version.
const generateManifestText = (version) => {
  return `CACHE MANIFEST
# Version: ${version}

CACHE:
../common.css

NETWORK:
*`;
};

/**
 * These manifests must be dynamically generated to ensure that the version
 * numbers can be bumped for the same file.
 * @return {Promise} Resolves once the files are written.
 */
const generateInitialManifests = () => {
  const manifestNames = ['manifest1.appcache', 'manifest2.appcache'];
  const fileCreationPromisees = manifestNames.map((filename) => {
    const outputPath = path.join(tempDirectory, filename);
    return fsePromise.outputFile(outputPath, generateManifestText(1));
  });

  return Promise.all(fileCreationPromisees);
};

const configureTestSuite = function(browser) {
  let globalDriverReference = null;
  let baseTestUrl;

  describe(`sw-appcache-behavior Test Suite with (${browser.getPrettyName()} - ${browser.getVersionNumber()})`, function() {
    this.timeout(TIMEOUT);
    this.retries(RETRIES);

    // Set up the web server before running any tests in this suite.
    before(function() {
      const buildFile = path.join(__dirname, '..', 'build',
        'client-runtime.js');
      try {
        fs.accessSync(buildFile, fs.F_OK);
      } catch (err) {
        throw new Error('Unable to find required build files. Please ' +
          'build this project before running any tests.');
      }


      return generateInitialManifests()
      .then(() => {
        return testServer.start('.');
      })
      .then((portNumber) => {
        baseTestUrl = `http://localhost:${portNumber}/packages/sw-appcache-behavior/test/`;
        console.log('Test Server: ' + baseTestUrl);
        console.log('');
      });
    });

    // Kill the web server once all tests are complete.
    after(function() {
      return seleniumAssistant.killWebDriver(globalDriverReference)
      .then(() => {
        return testServer.stop();
      })
      .then(() => {
        return fsePromise.remove(tempDirectory);
      });
    });

    it('should be able to get a global driver.', function() {
      return browser.getSeleniumDriver()
      .then((driver) => {
        globalDriverReference = driver;
        globalDriverReference.manage().timeouts().setScriptTimeout(TIMEOUT);
      });
    });

    it('should register a service worker to control the client', function() {
      const url = `${baseTestUrl}end-to-end-caching/step1.html`;
      return globalDriverReference.get(url)
      .then(() => {
        return globalDriverReference.wait(() => {
          return globalDriverReference.executeScript(() => {
            if (navigator.serviceWorker.controller) {
              return true;
            }

            return false;
          });
        });
      })
      .then(() => {
        return globalDriverReference.executeScript(() => {
          return navigator.serviceWorker.controller;
        });
      })
      .then(function(serviceWorker) {
        expect(serviceWorker).to.be.ok;
        expect(serviceWorker.state).to.not.equal('redundant');
      });
    });

    it('should create one cache', function() {
      return globalDriverReference.executeAsyncScript((callback) => {
        window.caches.keys().then(callback);
      })
      .then((caches) => {
        expect(caches).to.have.lengthOf(1);
      });
    });

    it('should cache items in the CACHE section of the manifest', function() {
      const manifestContent = fs.readFileSync(path.join(__dirname, 'end-to-end-caching', 'temp', 'manifest1.appcache')).toString();
      const parsedManifest = parseManifest(manifestContent);
      expect(parsedManifest.cache).to.have.length.above(0);

      return globalDriverReference.executeAsyncScript((entries, callback) => {
        Promise.all(
          entries.map((entry) => {
            // The App Cache manifest URL is the base for any relative URLs.
            const manifestUrl = new URL(
              document.documentElement.getAttribute('manifest'),
              window.location
            );
            const url = new URL(entry, manifestUrl);

            return window.caches.match(url.toString());
          })
        ).then(callback);
      }, parsedManifest.cache).then((matches) => {
        expect(matches).to.not.include(null);
      });
    });

    it('should cache a master entry for initial navigation', function() {
      return globalDriverReference.executeAsyncScript((callback) => {
        window.caches.match(window.location).then(callback);
      })
      .then((match) => {
        expect(match).to.be.ok;
      });
    });

    // NOTE
    //
    // NEW URL <--------------------------------------------
    //

    it('should cache another master entry for subsequent navigation', function() {
      const url = `${baseTestUrl}end-to-end-caching/step2.html`;
      return globalDriverReference.get(url)
      .then(() => {
        return globalDriverReference.executeAsyncScript((callback) => {
          window.setTimeout(() => {
            window.caches.match(window.location).then(callback);
          }, 100); // Timeouts... ugh.
        });
      })
      .then((match) => {
        expect(match).to.be.ok;
      });
    });

    it('should not cache a master entry when there is no manifest', function() {
      const url = `${baseTestUrl}end-to-end-caching/step3.html`;
      return globalDriverReference.get(url)
      .then(() => {
        return globalDriverReference.executeAsyncScript((callback) => {
          window.setTimeout(() => {
            window.caches.match(window.location).then(callback);
          }, 100); // Timeouts... ugh.
        });
      })
      .then((match) => {
        expect(match).to.be.null;
      });
    });

    it('should use a different cache when an existing manifest is updated', function() {
      return globalDriverReference.executeAsyncScript((callback) => {
        window.caches.keys().then(callback);
      })
      .then((previousCaches) => {
        const url = `${baseTestUrl}end-to-end-caching/step1.html`;
        // Write out an update to manifest1.appcache to trigger the App Cache
        // update flow.
        const outputPath = path.join(tempDirectory, 'manifest1.appcache');
        return fsePromise.outputFile(outputPath, generateManifestText(2))
          .then(() => globalDriverReference.get(url))
          .then(() => {
            return globalDriverReference.executeAsyncScript((callback) => {
              window.setTimeout(() => {
                // This will resolve with an array of arrays, with each item
                // in the inner array corresponding to a cache entry.
                window.caches.keys().then(callback);
              }, 500); // Timeouts... ugh.
            });
          }).then((currentCaches) => {
            // This is a roundabout way of checking to make sure there's one
            // entry in the set of new caches that wasn't in the previous
            // set. That new entry should be due to the updated manifest.
            const filtered = currentCaches.filter(
              (cache) => previousCaches.indexOf(cache) === -1);
            expect(filtered).to.have.lengthOf(1);
          });
      });
    });

    it('should use a different cache when the manifest is different', function() {
      return globalDriverReference.executeAsyncScript((callback) => {
        window.caches.keys().then(callback);
      }).then((previousCaches) => {
        const url = `${baseTestUrl}end-to-end-caching/step4.html`;
        return globalDriverReference.get(url).then(() => {
          return globalDriverReference.executeAsyncScript((callback) => {
            window.setTimeout(() => window.caches.keys().then(callback), 100);
          }).then((currentCaches) => {
            // This is a roundabout way of checking to make sure there's one
            // entry in the set of new caches that wasn't in the previous
            // set. That new entry should be due to the new manifest.
            const filtered = currentCaches.filter(
              (cache) => previousCaches.indexOf(cache) === -1);
            expect(filtered).to.have.lengthOf(1);
          });
        });
      });
    });
  });
};

seleniumAssistant.getLocalBrowsers().forEach(function(browser) {
  // Blackliist browsers here if needed.
  if (browser.getId() === 'opera' && browser.getVersionNumber() === 41) {
    console.warn('Skipping Opera version 41 due to operadriver error.');
    return;
  }

  switch (browser.getId()) {
    case 'chrome':
    case 'firefox':
    case 'opera':
      if (browser.getId() === 'opera' &&
        browser.getVersionNumber() <= 43) {
        console.log(`Skipping Opera <= 43 due to driver issues.`);
        return;
      }
      configureTestSuite(browser);
      break;
    default:
      console.warn(`Skipping ${browser.getPrettyName()}.`);
      break;
  }
});
