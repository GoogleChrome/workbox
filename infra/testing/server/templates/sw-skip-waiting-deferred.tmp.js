/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// {{ version }}

addEventListener('install', (event) => {
  const doneInstalling = new Promise((resolve) => {
    setTimeout(() => {
      skipWaiting();
      resolve();
    }, 500);
  });
  event.waitUntil(doneInstalling);
});
