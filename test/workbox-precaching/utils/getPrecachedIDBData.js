// Get the data for precached details from IDB via the window.
module.exports = () => {
  return global.__workbox.webdriver.executeAsyncScript((cb) => {
    const request = indexedDB.open('workbox-precaching');
    request.onerror = function(event) {
      cb('Error opening indexedDB');
    };
    request.onsuccess = function(event) {
      const db = event.target.result;

      const transaction = db.transaction(['precached-details-models'], 'readwrite');
      const objectStore = transaction.objectStore('precached-details-models');
      const getAllRequest = objectStore.getAll();
      getAllRequest.onerror = function(event) {
        cb('Error opening getting all content');
      };
      getAllRequest.onsuccess = function(event) {
        cb(event.target.result);
      };
    };
  });
};
