/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// {{ version }}

addEventListener('install', (event) => event.waitUntil(skipWaiting()));
addEventListener('activate', (event) => event.waitUntil(clients.claim()));

addEventListener('message', async (event) => {
  // Assert the type and meta are correct.
  if (event.data.type === 'WINDOW_READY' &&
      event.data.meta === 'workbox-window') {
    const windows = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    for (const win of windows) {
      win.postMessage({type: 'sw:message:ready'});
    }
  }
});
