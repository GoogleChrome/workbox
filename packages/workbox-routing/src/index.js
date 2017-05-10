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

/**
 * # workbox-routing
 *
 * A service worker helper library to route request URLs to handlers.
 *
 * @module workbox-routing
 */

/**
 * A handler that can be automatically invoked by a route, and knows how to
 * respond to a request. It can either be a standalone function or a subclass of
 * {@link module:workbox-runtime-caching.Handler|Handler}.
 *
 * @callback RouteHandler
 * @param {Object} input
 * @param {URL} input.url The request's URL.
 * @param {FetchEvent} input.event The event that triggered the `fetch` handler.
 * @param {Array<Object>} input.params Any additional parameters that the
 * {@link module:workbox-routing.Route|Route} provides, such as named parameters
 * in an {@link module:workbox-routing.ExpressRoute|ExpressRoute}.
 * @return {Promise<Response>} The response that will fulfill the request.
 * @memberof module:workbox-routing
 */

/**
 * A function that can be automatically invoked by a route to determine whether
 * or not an incoming network request should trigger the route's handler.
 *
 * @callback Matcher
 * @param {Object} input
 * @param {URL} input.url The request's URL.
 * @param {FetchEvent} input.event The event that triggered the `fetch` handler.
 * @return {Array<Object>|null} To signify a match, return a (possibly empty)
 * array of values which will be passed in a params to the
 * {@link module:workbox-routing.RouteHandler|RouteHandler}.
 * Otherwise, return null if the route shouldn't match.
 * @memberof module:workbox-routing
 */

import ExpressRoute from './lib/express-route';
import NavigationRoute from './lib/navigation-route';
import RegExpRoute from './lib/regexp-route';
import Route from './lib/route';
import Router from './lib/router';

export {
  ExpressRoute,
  NavigationRoute,
  RegExpRoute,
  Route,
  Router,
};
