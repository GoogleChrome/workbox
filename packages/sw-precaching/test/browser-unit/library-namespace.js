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
describe('Test Behaviors of Loading the Script', function() {
  this.timeout(5 * 60 * 1000);

  it('should print an error when added to the window.', function() {
    this.timeout(2000);

    return new Promise((resolve, reject) => {
      window.onerror = (msg, url, lineNo, columnNo, error) => {
        window.onerror = null;

        if (error.name === 'not-in-sw') {
          resolve();
          return true;
        } else {
          reject('Unexpected error received.');
          return false;
        }
      };

      const scriptElement = document.createElement('script');
      scriptElement.src = '/packages/sw-precaching/build/sw-precaching.min.js';
      scriptElement.addEventListener('error', (event) => {
        console.log(event);
        reject();
      });
      document.head.appendChild(scriptElement);
    });
  });

  const swUnitTests = [
    'sw-unit/basic.js',
    'sw-unit/revisioned-cache-manager.js',
  ];
  swUnitTests.forEach((swUnitTestPath) => {
    it(`should perform ${swUnitTestPath} sw tests`, function() {
      console.log(swUnitTestPath);
      return window.goog.mochaUtils.startServiceWorkerMochaTests(swUnitTestPath)
      .then((testResults) => {
        if (testResults.failed.length > 0) {
          const errorMessage = window.goog.mochaUtils.prettyPrintErrors(swUnitTestPath, testResults);
          throw new Error(errorMessage);
        }
      });
    });
  });
});
