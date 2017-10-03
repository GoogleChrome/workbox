import PrecacheController from './controllers/PrecacheController.mjs';

const precacheController = new PrecacheController();
let listenersAdded = false;

const addListeners = () => {
  listenersAdded = true;
  self.addEventListener('install', () => precacheController.install());
  self.addEventListener('activate', () => precacheController.cleanup());

  // TODO: Add Routing once workbox-routing is in.
};

/**
 * This method will add items to the precache list, removing duplicates
 * and ensuring the information is valid and add a Route to `workbox-routing`
 * to ensure precached assets are served using a CacheFirst strategy.
 *
 * @param {Array<Object|string>} entries Array of entries to precache.
 *
 * @alias module:workbox-precaching.precacheAndRoute
 */
const precacheAndRoute = (entries) => {
  precacheController.addToCacheList(entries);

  if (entries.length > 0 && !listenersAdded) {
    addListeners();
  }
};

export default {
  precacheAndRoute,
};
