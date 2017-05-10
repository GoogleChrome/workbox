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

  const deleteIndexedDB = () => {
    return new Promise((resolve, reject) => {
      // TODO: Move to constants
      const req = indexedDB.deleteDatabase('workbox-precaching');
      req.onsuccess = function() {
        resolve();
      };
      req.onerror = function() {
        reject();
      };
      req.onblocked = function() {
        console.error('Database deletion is blocked.');
      };
    });
  };

  beforeEach(function() {
    return window.goog.swUtils.cleanState()
    .then(deleteIndexedDB);
  });

  afterEach(function() {
    return window.goog.swUtils.cleanState()
    .then(deleteIndexedDB);
  });

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
      scriptElement.src = '/__test/bundle/sw-lib';
      scriptElement.addEventListener('error', (event) => {
        reject();
      });
      document.head.appendChild(scriptElement);
    });
  });
});
