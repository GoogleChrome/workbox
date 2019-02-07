/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxError} from 'workbox-core/_private/WorkboxError.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';
import {getFriendlyURL} from 'workbox-core/_private/getFriendlyURL.mjs';
import {QueueStore} from './lib/QueueStore.mjs';
import {StorableRequest} from './lib/StorableRequest.mjs';
import {TAG_PREFIX, MAX_RETENTION_TIME} from './lib/constants.mjs';
import './_version.mjs';

const queueNames = new Set();

/**
 * A class to manage storing failed requests in IndexedDB and retrying them
 * later. All parts of the storing and replaying process are observable via
 * callbacks.
 *
 * @memberof workbox.backgroundSync
 */
class Queue {
  /**
   * Creates an instance of Queue with the given options
   *
   * @param {string} name The unique name for this queue. This name must be
   *     unique as it's used to register sync events and store requests
   *     in IndexedDB specific to this instance. An error will be thrown if
   *     a duplicate name is detected.
   * @param {Object} [options]
   * @param {Function} [options.onSync] A function that gets invoked whenever
   *     the 'sync' event fires. The function is invoked with an object
   *     containing the `queue` property (referencing this instance), and you
   *     can use the callback to customize the replay behavior of the queue.
   *     When not set the `replayRequests()` method is called.
   * @param {number} [options.maxRetentionTime=7 days] The amount of time (in
   *     minutes) a request may be retried. After this amount of time has
   *     passed, the request will be deleted from the queue.
   */
  constructor(name, {onSync, maxRetentionTime} = {}) {
    // Ensure the store name is not already being used
    if (queueNames.has(name)) {
      throw new WorkboxError('duplicate-queue-name', {name});
    } else {
      queueNames.add(name);
    }

    this._name = name;
    this._onSync = onSync || this.replayRequests;
    this._maxRetentionTime = maxRetentionTime || MAX_RETENTION_TIME;
    this._queueStore = new QueueStore(this._name);

    this._addSyncListener();
  }

  /**
   * @return {string}
   */
  get name() {
    return this._name;
  }

  /**
   * Stores the passed request in IndexedDB (with its timestamp and any
   * metadata) at the end of the queue.
   *
   * @param {Object} entry
   * @param {Request} entry.request The request to store in the queue.
   * @param {Object} [entry.metadata] Any metadata you want associated with the
   *     stored request. When requests are replayed you'll have access to this
   *     metadata object in case you need to modify the request beforehand.
   * @param {number} [entry.timestamp] The timestamp (Epoch time in
   *     milliseconds) when the request was first added to the queue. This is
   *     used along with `maxRetentionTime` to remove outdated requests. In
   *     general you don't need to set this value, as it's automatically set
   *     for you (defaulting to `Date.now()`), but you can update it if you
   *     don't want particular requests to expire.
   */
  async pushRequest(entry) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(entry, 'object', {
        moduleName: 'workbox-background-sync',
        className: 'Queue',
        funcName: 'pushRequest',
        paramName: 'entry',
      });
      assert.isInstance(entry.request, Request, {
        moduleName: 'workbox-background-sync',
        className: 'Queue',
        funcName: 'pushRequest',
        paramName: 'entry.request',
      });
    }

    await this._addRequest(entry, 'push');
  }

  /**
   * Stores the passed request in IndexedDB (with its timestamp and any
   * metadata) at the beginning of the queue.
   *
   * @param {Object} entry
   * @param {Request} entry.request The request to store in the queue.
   * @param {Object} [entry.metadata] Any metadata you want associated with the
   *     stored request. When requests are replayed you'll have access to this
   *     metadata object in case you need to modify the request beforehand.
   * @param {number} [entry.timestamp] The timestamp (Epoch time in
   *     milliseconds) when the request was first added to the queue. This is
   *     used along with `maxRetentionTime` to remove outdated requests. In
   *     general you don't need to set this value, as it's automatically set
   *     for you (defaulting to `Date.now()`), but you can update it if you
   *     don't want particular requests to expire.
   */
  async unshiftRequest(entry) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isType(entry, 'object', {
        moduleName: 'workbox-background-sync',
        className: 'Queue',
        funcName: 'unshiftRequest',
        paramName: 'entry',
      });
      assert.isInstance(entry.request, Request, {
        moduleName: 'workbox-background-sync',
        className: 'Queue',
        funcName: 'unshiftRequest',
        paramName: 'entry.request',
      });
    }

    await this._addRequest(entry, 'unshift');
  }

  /**
   * Removes and returns the last request in the queue (along with its
   * timestamp and any metadata). The returned object takes the form:
   * `{request, timestamp, metadata}`.
   *
   * @return {Promise<Object>}
   */
  async popRequest() {
    return this._removeRequest('pop');
  }

  /**
   * Removes and returns the first request in the queue (along with its
   * timestamp and any metadata). The returned object takes the form:
   * `{request, timestamp, metadata}`.
   *
   * @return {Promise<Object>}
   */
  async shiftRequest() {
    return this._removeRequest('shift');
  }

  /**
   * Adds the entry to the QueueStore and registers for a sync event.
   *
   * @param {Object} entry
   * @param {Request} entry.request
   * @param {Object} [entry.metadata]
   * @param {number} [entry.timestamp=Date.now()]
   * @param {string} operation ('push' or 'unshift')
   */
  async _addRequest(
      {request, metadata, timestamp = Date.now()}, operation) {
    const storableRequest = await StorableRequest.fromRequest(request.clone());
    const entry = {
      requestData: storableRequest.toObject(),
      timestamp,
    };

    // Only include metadata if it's present.
    if (metadata) {
      entry.metadata = metadata;
    }

    await this._queueStore[`${operation}Entry`](entry);
    await this.registerSync();
    if (process.env.NODE_ENV !== 'production') {
      logger.log(`Request for '${getFriendlyURL(request.url)}' has ` +
          `been added to background sync queue '${this._name}'.`);
    }
  }

  /**
   * Removes and returns the first or last (depending on `operation`) entry
   * form the QueueStore that's not older than the `maxRetentionTime`.
   *
   * @param {string} operation ('pop' or 'shift')
   * @return {Object|undefined}
   */
  async _removeRequest(operation) {
    const now = Date.now();
    const entry = await this._queueStore[`${operation}Entry`]();

    if (entry ) {
      // Ignore requests older than maxRetentionTime. Call this function
      // recursively until an unexpired request is found.
      const maxRetentionTimeInMs = this._maxRetentionTime * 60 * 1000;
      if (now - entry.timestamp > maxRetentionTimeInMs) {
        return this._removeRequest(operation);
      }

      entry.request = new StorableRequest(entry.requestData).toRequest();
      delete entry.requestData;

      return entry;
    }
  }

  /**
   * Loops through each request in the queue and attempts to re-fetch it.
   * If any request fails to re-fetch, it's put back in the same position in
   * the queue (which registers a retry for the next sync event).
   */
  async replayRequests() {
    let entry;
    while (entry = await this.shiftRequest()) {
      try {
        await fetch(entry.request);

        if (process.env.NODE_ENV !== 'production') {
          logger.log(`Request for '${getFriendlyURL(entry.request.url)}'` +
             `has been replayed in queue '${this._name}'`);
        }
      } catch (error) {
        await this.unshiftRequest(entry);

        if (process.env.NODE_ENV !== 'production') {
          logger.log(`Request for '${getFriendlyURL(entry.request.url)}'` +
             `failed to replay, putting it back in queue '${this._name}'`);
        }
        throw new WorkboxError('queue-replay-failed', {name: this._name});
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      logger.log(`All requests in queue '${this.name}' have successfully ` +
          `replayed; the queue is now empty!`);
    }
  }

  /**
   * Registers a sync event with a tag unique to this instance.
   */
  async registerSync() {
    if ('sync' in registration) {
      try {
        await registration.sync.register(`${TAG_PREFIX}:${this._name}`);
      } catch (err) {
        // This means the registration failed for some reason, possibly due to
        // the user disabling it.
        if (process.env.NODE_ENV !== 'production') {
          logger.warn(
              `Unable to register sync event for '${this._name}'.`, err);
        }
      }
    }
  }

  /**
   * In sync-supporting browsers, this adds a listener for the sync event.
   * In non-sync-supporting browsers, this will retry the queue on service
   * worker startup.
   *
   * @private
   */
  _addSyncListener() {
    if ('sync' in registration) {
      self.addEventListener('sync', (event) => {
        if (event.tag === `${TAG_PREFIX}:${this._name}`) {
          if (process.env.NODE_ENV !== 'production') {
            logger.log(`Background sync for tag '${event.tag}'` +
                `has been received`);
          }
          event.waitUntil(this._onSync({queue: this}));
        }
      });
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logger.log(`Background sync replaying without background sync event`);
      }
      // If the browser doesn't support background sync, retry
      // every time the service worker starts up as a fallback.
      this._onSync({queue: this});
    }
  }

  /**
   * Returns the set of queue names. This is primarily used to reset the list
   * of queue names in tests.
   *
   * @return {Set}
   *
   * @private
   */
  static get _queueNames() {
    return queueNames;
  }
}

export {Queue};
