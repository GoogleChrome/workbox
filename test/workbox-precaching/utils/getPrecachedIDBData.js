// Get the data for precached details from IDB via the window.
module.exports = (dbName) => {
  return global.__workbox.webdriver.executeAsyncScript((dbName, cb) => {
    const request = indexedDB.open(dbName);
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
  }, dbName);
};
