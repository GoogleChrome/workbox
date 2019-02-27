/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';

import {NavigationRoute} from './NavigationRoute.mjs';
import {RegExpRoute} from './RegExpRoute.mjs';
import {registerNavigationRoute} from './registerNavigationRoute.mjs';
import {registerRoute} from './registerRoute.mjs';
import {Route} from './Route.mjs';
import {Router} from './Router.mjs';
import {setCatchHandler} from './setCatchHandler.mjs';
import {setDefaultHandler} from './setDefaultHandler.mjs';

import './_version.mjs';

if (process.env.NODE_ENV !== 'production') {
  assert.isSWEnv('workbox-routing');
}

/**
 * @namespace workbox.routing
 */

export {
  NavigationRoute,
  RegExpRoute,
  registerNavigationRoute,
  registerRoute,
  Route,
  Router,
  setCatchHandler,
  setDefaultHandler,
};
