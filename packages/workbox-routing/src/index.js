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
 * It's common in service workers to want to assign specific behaviors and logic
 * to a subset of requests that are received via the `fetch()` event.
 *
 * This library makes it easy to route requests to "handlers", which can be
 * existing behaviors from Workbox or functions for custom handling of a
 * request.
 *
 * @module workbox-routing
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
