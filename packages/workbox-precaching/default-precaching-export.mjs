import PrecacheController from './controllers/PrecacheController.mjs';

const precacheController = new PrecacheController();
let listenersAdded = false;

const addListeners = () => {
  listenersAdded = true;
  self.addEventListener('install', () => precacheController.install());
  self.addEventListener('activate', () => precacheController.cleanup());
};

/**
 * This method will add items to the precache list, removing duplicates
 * and ensuring the information is valid and add a Route to `workbox-routing`
 * to ensure precached assets are served using a CacheFirst strategy.
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

// TODO: Add a way to route these assets

export default {
  precache,
};
