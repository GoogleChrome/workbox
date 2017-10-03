import PrecacheController from './controllers/PrecacheController.mjs';

const precacheController = new PrecacheController();
let listenersAdded = false;

const addListeners = () => {
  listenersAdded = true;
  self.addEventListener('install', (event) => {
    event.waitUntil(precacheController.install());
  });
  self.addEventListener('activate', (event) => {
    event.waitUntil(precacheController.cleanup());
  });
};

/**
 * This method will add items to the precache list, removing duplicates
 * and ensuring the information is valid.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 *
 * @alias module:workbox-precaching.precache
 */
const precache = (entries) => {
  precacheController.addToCacheList(entries);

  if (entries.length > 0 && !listenersAdded) {
    addListeners();
  }
};

export default {
  precache,
};
