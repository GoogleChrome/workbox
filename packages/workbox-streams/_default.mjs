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

import {concatenate} from './concatenate.mjs';
import {responseFrom} from './responseFrom.mjs';

import './_version.mjs';

/**
 * A shortcut to create a strategy that could be dropped-in to Workbox's router.
 *
 * @param {
 *   Array<function(workbox.routing.Route~handlerCallback)>} sourceFunctions
 * Each function should return a {@link workbox.streams.StreamSource} (or a
 * Promise which resolves to one).
 * @params {HeadersInit} [headersInit] If there's no `Content-Type` specified,
 * `'text/html'` will be used by default.
 * @return {workbox.routing.Route~handlerCallback}
 *
 * @memberof workbox.streams
 */
function strategy(sourceFunctions, headersInit) {
  return ({event, url, params}) => {
    const {done, response} = responseFrom(sourceFunctions.map(
      (sourceFunction) => sourceFunction({event, url, params})), headersInit);
    event.waitUntil(done);
    return response;
  };
}

export default {
  concatenate,
  responseFrom,
  strategy,
};
