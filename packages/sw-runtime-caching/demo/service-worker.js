/* eslint-env worker, serviceworker */
/* global goog */

importScripts('../build/router.js');

// Have the service worker take control as soon as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const routes = [
  new goog.routing.Route({
    when: ({url}) => url.pathname.endsWith('.js'),
    handler: ({event}) => {
      console.log('JavaScript!');
      return fetch(event.request);
    },
  }),
];

const defaultHandler = ({event}) => {
  console.log('Default!');
  return fetch(event.request);
};

goog.routing.registerRoutes({routes, defaultHandler});
