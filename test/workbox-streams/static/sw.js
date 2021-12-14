/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-core');
importScripts('/__WORKBOX/buildFile/workbox-routing');
importScripts('/__WORKBOX/buildFile/workbox-streams');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// Test a variety of different sources.
const getSourceFunctions = () => [
  () => Promise.resolve('0'),
  () => Promise.resolve(new Response(1)),
  () => '2',
  () => new Response(3),
  () => fetch('4.txt'),
];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const crossOriginURL = url.searchParams.get('cross-origin-url');

  if (!workbox.streams.isSupported()) {
    event.respondWith(new Response('No streams support'));
  } else if (crossOriginURL) {
    const {done, response} = workbox.streams.concatenateToResponse(
      [
        () => 'this will',
        () => fetch(crossOriginURL, {mode: 'no-cors'}),
        () => 'error',
      ].map((f) => f()),
      {
        'content-type': 'text/plain',
        'x-test-case': 'crossOriginURL',
      },
    );
    event.respondWith(response);
    event.waitUntil(done);
  } else if (url.pathname.endsWith('concatenateToResponse')) {
    const {done, response} = workbox.streams.concatenateToResponse(
      getSourceFunctions().map((f) => f()),
      {
        'content-type': 'text/plain',
        'x-test-case': 'concatenateToResponse',
      },
    );
    event.respondWith(response);
    event.waitUntil(done);
  } else if (url.pathname.endsWith('concatenate')) {
    const {done, stream} = workbox.streams.concatenate(
      getSourceFunctions().map((f) => f()),
    );
    const response = new Response(stream, {
      headers: {
        'content-type': 'text/plain',
        'x-test-case': 'concatenate',
      },
    });
    event.respondWith(response);
    event.waitUntil(done);
  }
});

workbox.routing.registerRoute(
  ({url}) => url.pathname.endsWith('strategy'),
  workbox.streams.strategy(getSourceFunctions(), {
    'content-type': 'text/plain',
    'x-test-case': 'strategy',
  }),
);
