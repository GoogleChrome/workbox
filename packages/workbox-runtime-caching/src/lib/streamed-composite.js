/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

import Handler from './handler';
import {isArrayOfType, isInstance} from '../../../../lib/assert';

/**
 *
 * @example
 *
 * @memberof module:workbox-runtime-caching
 * @extends module:workbox-runtime-caching.Handler
 */
class StreamedComposite extends Handler {
  /**
   * Constructor for a new StreamedComposite instance.
   *
   * @param {Object} input
   * @param {
   * module:workbox-runtime-caching.RequestWrapper} [input.requestWrapper]
   * An optional `RequestWrapper` that is used to
   * configure the cache name and request plugins. If
   * not provided, a new `RequestWrapper` using the
   * [default cache name](#defaultCacheName) will be used.
   * @param {Object} [input.headers] Headers to use for the composite response.
   * By default, a `Content-Type: 'text/html'` header will be used, but that
   * can be overridden.
   * @param {Array<function>} [input.streamSources] The functions that will be
   * called sequentially when constructed a response. Each function should
   * return a promise for an object that implements `ReadableStream`.
   */
  constructor(input = {}) {
    const streamSources = input.streamSources;
    isArrayOfType({streamSources}, 'function');

    super(input);
    this.headers = Object.assign({'content-type': 'text/html'}, input.headers);
    this.streamSources = streamSources;

    this._initializeAsyncWaitUntilPolyfill();
  }

  /**
   * The handle method will be called by the
   * {@link module:workbox-routing.Route|Route} class when a route matches a
   * request.
   *
   * @param {Object} input
   * @param {FetchEvent} input.event The event that triggered the service
   * worker's fetch handler.
   * @param {Object} [input.params] Any parameters that were returned by the
   * matching {@link module:workbox-routing.Route}.
   * @return {Promise.<Response>} The response, composed off all the individual
   * streams of data.
   */
  async handle({event, params} = {}) {
    isInstance({event}, FetchEvent);

    const streamPromises = this.streamSources.map(
      (streamSource) => streamSource({event, params}));

    return this._mergeResponses(streamPromises).then(({done, response}) => {
      event.waitUntil(done);
      return response;
    });
  }

  /**
   * @private
   * @param {Array<Promise>} streamPromises
   * @param {Object} headers
   * @return {*}
   */
  _mergeResponses(streamPromises) {
    const readers = streamPromises.map(
      (p) => Promise.resolve(p).then((r) => r.body.getReader()));

    let fullStreamedResolve;
    let fullyStreamedReject;
    const done = new Promise((resolve, reject) => {
      fullStreamedResolve = resolve;
      fullyStreamedReject = reject;
    });

    const readable = new ReadableStream({
      pull(controller) {
        return readers[0].then((reader) => reader.read()).then((result) => {
          if (result.done) {
            readers.shift();

            if (!readers[0]) {
              controller.close();
              fullStreamedResolve();
              return;
            }
            return this.pull(controller);
          }

          controller.enqueue(result.value);
        }).catch((err) => {
          fullyStreamedReject(err);
          throw err;
        });
      },
      cancel() {
        fullStreamedResolve();
      },
    });

    return streamPromises[0].then(() => {
      return {done, response: new Response(readable, {
        headers: this.headers,
      })};
    });
  }

  /**
   * See https://github.com/jakearchibald/async-waituntil-polyfill
   *
   * @private
   */
  _initializeAsyncWaitUntilPolyfill() {
    const waitUntil = ExtendableEvent.prototype.waitUntil;
    const respondWith = FetchEvent.prototype.respondWith;
    const promisesMap = new WeakMap();

    ExtendableEvent.prototype.waitUntil = function(promise) {
      const extendableEvent = this;
      let promises = promisesMap.get(extendableEvent);

      if (promises) {
        promises.push(Promise.resolve(promise));
        return;
      }

      promises = [Promise.resolve(promise)];
      promisesMap.set(extendableEvent, promises);

      // call original method
      return waitUntil.call(
        extendableEvent, Promise.resolve().then(function processPromises() {
        const len = promises.length;

        // wait for all to settle
        return Promise.all(promises.map(p => p.catch(()=>{}))).then(() => {
          // have new items been added? If so, wait again
          if (promises.length != len) {
            return processPromises();
          }
          // we're done!
          promisesMap.delete(extendableEvent);
          // reject if one of the promises rejected
          return Promise.all(promises);
        });
      }));
    };

    FetchEvent.prototype.respondWith = function(promise) {
      this.waitUntil(promise);
      return respondWith.call(this, promise);
    };
  }
}

export default StreamedComposite;
