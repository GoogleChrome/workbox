const messageClients = async (data) => {
  const windowClients = await self.clients.matchAll();
  windowClients.forEach((client) => {
    client.postMessage(data);
  });
};

// This is needed by Safari as SW IDB is seperate from Window IDB
self.addEventListener('message', (event) => {
  const request = indexedDB.open('workbox-precaching');
  request.onerror = async function(event) {
    messageClients('Error opening indexedDB');
  };

  request.onsuccess = function(event) {
    const db = event.target.result;

    const transaction = db.transaction(['precached-details-models'], 'readwrite');
    const objectStore = transaction.objectStore('precached-details-models');
    const getAllRequest = objectStore.getAll();
    getAllRequest.onerror = function(event) {
      messageClients('Error opening getting all content');
    };
    getAllRequest.onsuccess = function(event) {
      messageClients(event.target.result);
    };
  };
});
