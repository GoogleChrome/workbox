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

import {logger} from 'workbox-core/_private/logger.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';

import './_version.mjs';

/**
 * TODO: Write something.
 *
 * @param {Array<Promise<Response>|Response>} responseSources
 * @param {Object} [headersInit]
 * @return {Object{completionPromise: <Promise>, response: <Response>}}
 *
 * @private
 */
function concatenate(responseSources, headersInit) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isArray(responseSources, {
      moduleName: 'workbox-streams',
      funcName: 'concatenate',
      paramName: 'responseSources',
    });
  }

  const headers = new Headers(headersInit);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'text/html');
  }

  const readerPromises = responseSources.map((responseSource) => {
    return Promise.resolve(responseSource).then((potentialResponse) => {
      if (potentialResponse instanceof Response) {
        return potentialResponse.body.getReader();
      } else {
        // TODO: This should be possible to do by constructing a ReadableStream.
        return new Response(potentialResponse).body.getReader();
      }
    });
  });

  let fullyStreamedResolve;
  let fullyStreamedReject;
  const completionPromise = new Promise((resolve, reject) => {
    fullyStreamedResolve = resolve;
    fullyStreamedReject = reject;
  });

  const readableStream = new ReadableStream({
    pull(controller) {
      console.log({controller});
      return readerPromises[0]
        .then((reader) => reader.read())
        .then((result) => {
          if (process.env.NODE_ENV !== 'production') {
            logger.log({result});
          }
          if (result.done) {
            readerPromises.shift();

            if (readerPromises.length === 0) {
              controller.close();
              fullyStreamedResolve();
              return;
            }

            return this.pull(controller);
          } else {
            controller.enqueue(result.value);
          }
        }).catch((err) => {
          fullyStreamedReject(err);
          throw err;
        });
    },

    cancel() {
      fullyStreamedResolve();
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    logger.log('about to return.');
  }

  const response = new Response(readableStream, {headers});
  return {completionPromise, response};
}

export {concatenate};
