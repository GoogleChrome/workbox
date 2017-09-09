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

/* eslint-env worker, serviceworker */

import constants from './lib/constants.js';
import {QueuePlugin} from '../../workbox-background-sync/src/index.js';
import {Route, Router} from '../../workbox-routing/src/index.js';
import {NetworkFirst, NetworkOnly, RequestWrapper}
    from '../../workbox-runtime-caching/src/index.js';

/**
 * In order to use the library, call
 * `workbox.googleAnalytics.initialize()`.
 * It will take care of setting up service worker `fetch` handlers to ensure
 * that the Google Analytics JavaScript is available offline, and that any
 * Google Analytics requests made while offline are queued and retried via
 * background sync.
 *
 * @example
 * // This code should live inside your service worker JavaScript, ideally
 * // before any other 'fetch' event handlers are defined:
 * workbox.googleAnalytics.initialize();
 *
 * @example
 * // If you need to specify parameters to be sent with each hit, you can use
 * // the `parameterOverrides` configuration option. This is useful in cases
 * // where you want to set a custom dimension on all hits sent by the service
 * // worker to differentiate them in your reports later.
 * // For parameter usage details, see:
 * // https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 * workbox.googleAnalytics.initialize({
 *   parameterOverrides: {
 *     cd1: 'replay'
 *   }
 * });
 *
 * @example
 * // In situations where you need to programmatically modify a hit's
 * // parameters you can use the `hitFilter` option. One example of when this
 * // might be useful is if you wanted to track the amount of time that elapsed
 * // between when the hit was attempted and when it was successfully replayed.
 * // For parameter usage details, see:
 * // https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 * workbox.googleAnalytics.initialize({
 *   hitFilter: (params) =>
 *     // Sets the `qt` param as a custom metric.
 *     const qt = params.get('qt');
 *     params.set('cm1', qt);
 *   }
 * });
 *
 * @module workbox-google-analytics
 */


/**
 * Creates the requestWillDequeue callback to be used with the background
 * sync queue plugin. The callback takes the failed request and adds the
 * `qt` param based on the current time, as well as applies any other
 * user-defined hit modifications.
 * @param {Object} config See workbox.googleAnalytics.initialize.
 * @return {Function} The requestWillDequeu callback function.
 */
const createRequestWillDequeueCallback = (config) => {
  return (reqData) => {
    const {request} = reqData;
    const hitTime = reqData.metadata.creationTimestamp;
    const queueTime = Date.now() - hitTime;

    // Measurement protocol requests can set their payload parameters in either
    // the URL query string (for GET requests) or the POST body.
    const params = request.body ? new URLSearchParams(request.body) :
        new URL(request.url).searchParams;

    // Set the qt param prior to apply the hitFilter or parameterOverrides.
    params.set('qt', queueTime);

    if (config.parameterOverrides) {
      for (const param of Object.keys(config.parameterOverrides)) {
        const value = config.parameterOverrides[param];
        params.set(param, value);
      }
    }

    if (typeof config.hitFilter == 'function') {
      config.hitFilter.call(null, params);
    }

    request.body = params.toString();
    request.method = 'POST';
    request.mode = 'cors';
    request.credentials = 'omit';
    request.headers = '[["Content-Type", "text/plain"]]';
    request.url = `https://${constants.URL.HOST}${constants.URL.COLLECT_PATH}`;
  };
};

/**
 * Creates GET and POST routes to catch failed Measurement Protocol hits.
 * @param {Function} requestWillDequeueCallback The callback used by
 *     background sync when requests are dequeued and retried.
 * @return {Array<Route>} The created routes.
 */
const createCollectRoutes = (requestWillDequeueCallback) => {
  const bgSyncQueuePlugin = new QueuePlugin({
    dbName: constants.IDB.NAME,
    maxRetentionTime: constants.STOP_RETRYING_AFTER,
    callbacks: {requestWillDequeue: requestWillDequeueCallback},
  });

  const match = ({url}) => url.hostname == constants.URL.HOST &&
      url.pathname == constants.URL.COLLECT_PATH;

  const handler = new NetworkOnly({
    requestWrapper: new RequestWrapper({plugins: [bgSyncQueuePlugin]}),
  });

  return [
    new Route({method: 'GET', match, handler}),
    new Route({method: 'POST', match, handler}),
  ];
};

/**
 * Creates a route with a network first strategy for the analytics.js script.
 * @return {Route} The created route.
 */
const createAnalyticsJsRoute = () => {
  return new Route({
    match: ({url}) => {
      return url.hostname == constants.URL.HOST &&
          url.pathname == constants.URL.ANALYTICS_JS_PATH;
    },
    handler: new NetworkFirst({
      requestWrapper: new RequestWrapper({cacheName: constants.CACHE_NAME}),
    }),
  });
};

/**
 * @alias workbox.googleAnalytics.initialize
 * @param {Object=} [config]
 * @param {Object} [config.parameterOverrides]
 *     [Measurement Protocol parameters](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters),
 *     expressed as key/value pairs, to be added to replayed Google Analytics
 *     requests. This can be used to, e.g., set a custom dimension indicating
 *     that the request was replayed.
 * @param {Function} [config.hitFilter] A function that allows you to modify
 *     the hit parameters prior to replaying
 *     the hit. The function is invoked with the original hit's URLSearchParams
 *     object as its only argument.
 * @memberof module:workbox-google-analytics
 */
export const initialize = (config = {}) => {
  const router = new Router();
  const requestWillDequeueCallback = createRequestWillDequeueCallback(config);

  router.registerRoutes({
    routes: [
      createAnalyticsJsRoute(),
      ...createCollectRoutes(requestWillDequeueCallback),
    ],
  });
  router.addFetchListener();
};

