/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// This needs to be kept in sync with the naming convention used by workbox-precaching.
const DB_NAME = 'workbox-precache-http___localhost_3004_test_workbox-precaching_static_precache-and-update_';

const messageClients = async (data) => {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage(data);
  }
};

// Work around the fact that Safari makes it hard to read IDB entries that were
// set in the service worker from a window client by listening for an incoming
// message, and messaging out the IDB entries to all clients.
self.addEventListener('message', () => {
  const request = indexedDB.open(DB_NAME);

  request.onerror = function() {
    messageClients('Error opening indexedDB');
  };

  request.onsuccess = function(event) {
    try {
      const db = event.target.result;
      const transaction = db.transaction('precached-details-models', 'readonly');
      const objectStore = transaction.objectStore('precached-details-models');
      const getAllRequest = objectStore.getAll();
      getAllRequest.onerror = function() {
        messageClients('Error calling getAll()');
      };
      getAllRequest.onsuccess = function(event) {
        messageClients(event.target.result);
      };
    } catch (error) {
      messageClients(error);
    }
  };
});
