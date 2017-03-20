/* eslint-env worker, serviceworker */
/* global goog */

importScripts(
  '../../sw-routing/build/sw-routing.js'
);


self.goog.logLevel = self.goog.LOG_LEVEL.verbose;

const exampleOne = 'Hello World 1';
self.goog.temp.info(exampleOne);
self.goog.temp.debug(exampleOne);
self.goog.temp.warn(exampleOne);
self.goog.temp.error(exampleOne);

const exampleTwo = {
  message: 'Hello World 2',
};
self.goog.temp.info(exampleTwo);
self.goog.temp.debug(exampleTwo);
self.goog.temp.warn(exampleTwo);
self.goog.temp.error(exampleTwo);

console.log('----------------------------');

const exampleThree = {
  that: this,
  message: 'Hello World 3',
};
self.goog.temp.info(exampleThree);
self.goog.temp.debug(exampleThree);
self.goog.temp.warn(exampleThree);
self.goog.temp.error(exampleThree);


// Have the service worker take control as soon as possible.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/** const route = new goog.routing.ExpressRoute({
  path: '/packages/:project/demo/:file',
  handler: ({event, params}) => {
    console.log('The matching params are', params);
    return fetch(event.request);
  },
});

const router = new goog.routing.Router();
router.registerRoute({route});**/
