/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

addEventListener('install', () => skipWaiting());

addEventListener('message', async (event) => {
  if (event.data.type === 'RESPOND_TO_MESSAGE') {
    event.ports[0].postMessage('Reply from SW!');
  } else if (event.data.type === 'POST_MESSAGE_BACK') {
    const windows = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    for (const win of windows) {
      win.postMessage('postMessage from SW!');
    }
  } else if (event.data.type === 'BROADCAST_BACK') {
    const bc = new BroadcastChannel('workbox');
    bc.postMessage('BroadcastChannel from SW!');
  }
});
