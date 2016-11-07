/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import Route from './route';
import assert from '../../../../lib/assert';

/**
 * The Router takes a set of {@link Route}'s and will direct fetch events
 * to those Route in the order they are registered.
 *
 * @memberof module:sw-routing
 */
class Router {
  /**
   * A default handler will have it's handle method called when a
   * request doesn't have a matching route.
   * @param {Object} input
   * @param {Handler} input.handler A handler to deal with default routes.
   */
  setDefaultHandler({handler} = {}) {
    assert.hasMethod({handler}, 'handle');

    this.defaultHandler = handler;
  }

  /**
   * If a Route throws an error while handling a request, this catch handler
   * will be called to return an error case.
   * @param {Object} input
   * @param {Handler} input.handler A handler to deal with errors in routes.
   */
  setCatchHandler({handler} = {}) {
    assert.hasMethod({handler}, 'handle');

    this.catchHandler = handler;
  }

  /**
   * Register routes will take an array of Routes to register with the
   * router.
   *
   * @param {Object} options
   * @param {Array<Route>} options.routes
   * @return {void}
   */
  registerRoutes({routes} = {}) {
    assert.isInstance({routes}, Array);

    self.addEventListener('fetch', (event) => {
      const url = new URL(event.request.url);
      if (!url.protocol.startsWith('http')) {
        return;
      }

      let responsePromise;
      for (let route of (routes || [])) {
        if (route.method !== event.request.method) {
          continue;
        }

        const matchResult = route.match({url, event});
        if (matchResult || matchResult === 0 || matchResult === '') {
          responsePromise = route.handler.handle({
            url,
            event,
            params: matchResult,
          });
          break;
        }
      }

      if (!responsePromise && this.defaultHandler) {
        responsePromise = this.defaultHandler.handle({url, event});
      }

      if (responsePromise && this.catchHandler) {
        responsePromise = responsePromise.catch((error) => {
          return this.catchHandler.handle({url, event, error});
        });
      }

      if (responsePromise) {
        event.respondWith(responsePromise);
      }
    });
  }

  /**
   * Registers a route with the router.
   * @param {Object} input
   * @param {Route} input.route The route to register.
   */
  registerRoute({route} = {}) {
    assert.isInstance({route}, Route);

    this.registerRoutes({routes: [route]});
  }
}

export default Router;
