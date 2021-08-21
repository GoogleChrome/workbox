/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts(
  '../../../../packages/workbox-core/build/browser/workbox-core.dev.js',
);
importScripts(
  '../../../../packages/workbox-routing/build/browser/workbox-routing.dev.js',
);

const routing = self.workbox.routing;
const Route = self.workbox.routing.Route;

const specialImgURL = new URL(
  '/test/workbox-routing/static/demo-img.png',
  location,
).toString();
const specialImgRoute = new Route(
  ({event}) => {
    return event.request.url === specialImgURL;
  },
  () => {
    return fetch(
      'http://via.placeholder.com/300x300/ffffff/F57C00?text=Hello+from+Workbox',
      {mode: 'no-cors'},
    );
  },
);
routing.registerRoute(specialImgRoute);
