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

import './_version.mjs';

/**
 * TODO: Write something.
 *
 * @param promiseSources
 * @param headersInit
 * @return {function({event: *, url: *, params: *})}
 *
 * @alias workbox.streams.strategy
 */
function strategy(promiseSources, headersInit) {
  return ({event, url, params}) => {
    const {completionPromise, response} = concatenate(promiseSources.map(
      (promiseSource) => promiseSource({event, url, params})), headersInit);
    event.waitUntil(completionPromise);
    return response;
  };
}

const moduleExports = {
  /**
   * TODO: Write something.
   *
   * @param {Array<Promise<Response>|Response>} responseSources
   * @param {Object} [headersInit]
   * @return {Object{completionPromise: <Promise>, response: <Response>}}
   *
   * @alias workbox.streams.concatenate
   */
  concatenate,
  strategy,
};

export default moduleExports;
