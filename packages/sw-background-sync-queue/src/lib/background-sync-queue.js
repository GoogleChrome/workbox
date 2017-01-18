import RequestManager from './request-manager';
import RequestQueue from './request-queue';
import {maxAge} from './constants';
import assert from '../../../../lib/assert';
import IDBHelper from '../../../../lib/idb-helper';
import {getDbName} from './background-sync-idb-helper';

/**
 * Use the instance of this class to push the failed requests into the queue.
 *
 * @example
 * // Case 1: When you want to push the requests manually
 * let bgQueue = new goog.backgroundSyncQueue.BackgroundSyncQueue();
 * self.addEventListener('fetch', function(e) {
 *		if (e.request.url.startsWith('https://jsonplaceholder.typicode.com')) {
 *			const clone = e.request.clone();
 *			e.respondWith(fetch(e.request).catch((err)=>{
 *				bgQueue.pushIntoQueue({
 *					request: clone,
 *				});
 *				throw err;
 *			}));
 *	 	}
 * });
 * // Case 2: When you want the higher level framework to take care of failed
 * requests
 * // TODO: add example here
 *
 * @alias goog.backgroundSyncQueue.BackgroundSyncQueue
 * @class BackgroundSyncQueue
 *
 */
class BackgroundSyncQueue {
	/**
	 * Creates an instance of BackgroundSyncQueue with the given options
	 *
	 * @param {Object} [input]
	 * @param {Number} [input.maxRetentionTime = 5 days] Time for which a queued
	 * request will live in the queue(irespective of failed/success of replay)
	 * @param {Object} [input.callbacks] Callbacks for successfull/ failed
	 * replay of a request
	 * @param {string} [input.queueName] Queue name inside db in which
	 * requests will be queued
	 * @param {BroadcastChannel=} [input.broadcastChannel] BroadcastChannel
	 * which will be used to publish messages when the request will be queued.
	 */
	constructor({maxRetentionTime = maxAge, callbacks, queueName,
		broadcastChannel} = {}) {
			if(queueName) {
				assert.isType({queueName}, 'string');
			}

			if(maxRetentionTime) {
				assert.isType({maxRetentionTime}, 'number');
			}

			if(broadcastChannel) {
				assert.isInstance({broadcastChannel}, BroadcastChannel);
			}

			this._queue = new RequestQueue({
				config: {
					maxAge: maxRetentionTime,
				},
				queueName,
				idbQDb: new IDBHelper(getDbName(), 1, 'QueueStore'),
				broadcastChannel,
			});
			this._requestManager = new RequestManager({callbacks,
				queue: this._queue});
	}

	/**
	 * This function pushes a given request into the IndexedDb Queue
	 *
	 * @param {Object} input
	 * @param {Request} input.request The request which is to be queued
	 *
	 * @returns {Promise} Promise which resolves when the request is pushed in
	 * the queue
	 */
	pushIntoQueue({request}) {
		assert.isInstance({request}, Request);
		return this._queue.push({request});
	}
}

export default BackgroundSyncQueue;
