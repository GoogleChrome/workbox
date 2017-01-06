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

/* eslint-env browser */
/* eslint-disable no-console */

import ErrorFactory from './lib/error-factory';
import SWLib from './lib/sw-lib';
import {Route} from '../../sw-routing/src/index.js';
import assert from '../../../lib/assert.js';

if (!assert.isSWEnv()) {
  // We are not running in a service worker, print error message
  throw ErrorFactory.createError('not-in-sw');
}

/**
 * The sw-lib module is a high-level library that makes it easier to
 * configure routes with caching strategies as well as manage precaching
 * of assets during the install step of a service worker.
 *
 * @example
 * importScripts('/<Path to Module>/build/sw-lib.min.js');
 *
 * goog.swlib.cacheRevisionedAssets([
 *     '/styles/main.1234.css',
 *     {
 *       url: '/index.html',
 *       revision: '1234'
 *     }
 * ]);
 *
 * goog.swlib.warmRuntimeCache([
 *     '/scripts/main.js',
 *     new Request('/images/logo.png')
 * ]);
 *
 * goog.swlib.router.registerRoute('/', goog.swlib.cacheFirst);
 * goog.swlib.router.registerRoute('/example/', goog.swlib.networkFirst);
 *
 * @module sw-lib
 */

const swLibInstance = new SWLib();
swLibInstance.Route = Route;
export default swLibInstance;
