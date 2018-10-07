/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// Safari's IDB is different between Window and SW.
// So to get the details, they need to come from the SW.
module.exports = () => {
  return global.__workbox.webdriver.executeAsyncScript((cb) => {
    navigator.serviceWorker.addEventListener('message', function(event) {
      cb(event.data);

      navigator.serviceWorker.removeEventListener('message', this);
    });

    navigator.serviceWorker.controller.postMessage('idb-request');
  });
};
