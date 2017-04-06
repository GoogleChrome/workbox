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

const chai = require('chai');
const parseManifest = require('parse-appcache-manifest');
const path = require('path');
const promisify = require('promisify-node');
const fs = require('fs');

const testServerGen = require('../../../../utils/test-server-generator');

const fsePromise = promisify('fs-extra');

const expect = chai.expect;
let tempDirectory = path.join(__dirname, '..', 'end-to-end-caching', 'temp');

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

module.exports = (webdriverCb) => {
  describe(`sw-appcache-behavior Integration Test`, function() {
    this.timeout(10 * 1000);
    this.retries(3);

    let testServer;
    let baseTestUrl;
    let webdriverInstance;

    // Set up the web server before running any tests in this suite.
    before(function() {
      webdriverInstance = webdriverCb();
      if (!webdriverInstance) {
        throw new Error('Unable to get web driver instance.');
      }

      webdriverInstance.manage().timeouts().setScriptTimeout(10 * 1000);

      const buildFile = path.join(__dirname, '..', '..', 'build',
        'client-runtime.js');

      try {
        fs.accessSync(buildFile, fs.F_OK);
      } catch (err) {
        throw new Error('Unable to find required build files. Please ' +
          'build this project before running any tests.');
      }

      return generateInitialManifests()
      .then(() => {
        testServer = testServerGen();
        return testServer.start('.', 5050);
      })
      .then((portNumber) => {
        baseTestUrl = `http://localhost:${portNumber}/packages/sw-appcache-behavior/test/`;
      });
    });

    // Kill the web server once all tests are complete.
    after(function() {
      const promises = [
         fsePromise.remove(tempDirectory),
      ];
      if (testServer) {
        promises.push(testServer.stop());
      }

      return Promise.all(promises);
    });

    it('should register a service worker to control the client', function() {
      const url = `${baseTestUrl}end-to-end-caching/step1.html`;
      return webdriverInstance.get(url)
      .then(() => {
        return webdriverInstance.wait(() => {
          return webdriverInstance.executeScript(() => {
            if (navigator.serviceWorker.controller) {
              return true;
            }

            return false;
          });
        });
      })
      .then(() => {
        return webdriverInstance.executeScript(() => {
          return navigator.serviceWorker.controller;
        });
      })
      .then(function(serviceWorker) {
        expect(serviceWorker).to.be.ok;
        expect(serviceWorker.state).to.not.equal('redundant');
      });
    });

    it('should create one cache', function() {
      return webdriverInstance.executeAsyncScript((callback) => {
        window.caches.keys().then(callback);
      })
      .then((caches) => {
        expect(caches).to.have.lengthOf(1);
      });
    });

    it('should cache items in the CACHE section of the manifest', function() {
      const manifestContent = fs.readFileSync(path.join(__dirname, '..', 'end-to-end-caching', 'temp', 'manifest1.appcache')).toString();
      const parsedManifest = parseManifest(manifestContent);
      expect(parsedManifest.cache).to.have.length.above(0);

      return webdriverInstance.executeAsyncScript((entries, callback) => {
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
      return webdriverInstance.executeAsyncScript((callback) => {
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
      return webdriverInstance.get(url)
      .then(() => {
        return webdriverInstance.executeAsyncScript((callback) => {
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
      return webdriverInstance.get(url)
      .then(() => {
        return webdriverInstance.executeAsyncScript((callback) => {
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
      return webdriverInstance.executeAsyncScript((callback) => {
        window.caches.keys().then(callback);
      })
      .then((previousCaches) => {
        const url = `${baseTestUrl}end-to-end-caching/step1.html`;
        // Write out an update to manifest1.appcache to trigger the App Cache
        // update flow.
        const outputPath = path.join(tempDirectory, 'manifest1.appcache');
        return fsePromise.outputFile(outputPath, generateManifestText(2))
          .then(() => webdriverInstance.get(url))
          .then(() => {
            return webdriverInstance.executeAsyncScript((callback) => {
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
      return webdriverInstance.executeAsyncScript((callback) => {
        window.caches.keys().then(callback);
      }).then((previousCaches) => {
        const url = `${baseTestUrl}end-to-end-caching/step4.html`;
        return webdriverInstance.get(url).then(() => {
          return webdriverInstance.executeAsyncScript((callback) => {
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
