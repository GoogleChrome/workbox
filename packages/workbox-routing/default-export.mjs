/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import Router from './Router.mjs';
import './_version.mjs';

const router = new Router();

// By default, register a fetch event listener that will respond to a request
// only if there's a matching route.
self.addEventListener('fetch', (event) => {
  const responsePromise = router.handleRequest(event);
  if (responsePromise) {
    event.respondWith(responsePromise);
  }
});

/**
 * [See Router.handleRequest()]{@link
 * module:workbox-routing.Router#handleRequest}
 *
 * @function
 * @name module:workbox-routing.handleRequest
 */

/**
 * [See Router.setDefaultHandler()]{@link
 * module:workbox-routing.Router#setDefaultHandler}
 *
 * @function
 * @name module:workbox-routing.setDefaultHandler
 */

/**
 * [See Router.setCatchHandler()]{@link
 * module:workbox-routing.Router#setCatchHandler}
 *
 * @function
 * @name module:workbox-routing.setCatchHandler
 */

/**
 * [See Router.registerRoute()]{@link
 * module:workbox-routing.Router#registerRoute}
 *
 * @function
 * @name module:workbox-routing.registerRoute
 */

/**
 * [See Router.unregisterRoute()]{@link
 * module:workbox-routing.Router#unregisterRoute}
 *
 * @function
 * @name module:workbox-routing.unregisterRoute
 */

export default router;
