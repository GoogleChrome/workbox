import RequestManager from './request-manager';
import RequestQueue from './request-queue';
import {maxAge, defaultDBName} from './constants';
import assert from '../../../../lib/assert';
import IDBHelper from '../../../../lib/idb-helper';
import {cleanupQueue} from './queue-utils';
import {getResponse} from './response-manager';

/**
 * Use the instance of this class to push the failed requests into the queue.
 *
 * @example
 * When you want to push the requests manually
 * let bgQueue = new goog.backgroundSyncQueue.Queue();
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
 *
 * @memberof module:queue
 */
class Queue {
	/**
	 * Creates an instance of Queue with the given options
	 *
	 * @param {Object} [input]
	 * @param {Number} [input.maxRetentionTime = 5 days] Time for which a queued
	 * request will live in the queue(irespective of failed/success of replay).
	 * @param {Object} [input.callbacks] Callbacks for successfull/ failed
	 * replay of a request.
	 * @param {string} [input.queueName] Queue name inside db in which
	 * requests will be queued.
	 * @param {BroadcastChannel=} [input.broadcastChannel] BroadcastChannel
	 * which will be used to publish messages when the request will be queued.
	 */
	constructor({maxRetentionTime = maxAge, callbacks, queueName,
		broadcastChannel, dbName = defaultDBName} = {}) {
			if(queueName) {
				assert.isType({queueName}, 'string');
			}

			if(maxRetentionTime) {
				assert.isType({maxRetentionTime}, 'number');
			}

			if(broadcastChannel) {
				assert.isInstance({broadcastChannel}, BroadcastChannel);
			}

			assert.isType({dbName}, 'string');

			this._dbName = dbName;
			this._queue = new RequestQueue({
				config: {
					maxAge: maxRetentionTime,
				},
				queueName,
				idbQDb: new IDBHelper(this._dbName, 1, 'QueueStore'),
				broadcastChannel,
			});
			this._requestManager = new RequestManager({callbacks,
				queue: this._queue});

			this.cleanupQueue();
	}

	/**
	 * clean up the queue, deleting all the tasks whose maxAge has expired
	 *
	 * @memberOf Queue
	 * @private
	 * @return {Promise}
	 */
	cleanupQueue() {
		return cleanupQueue(this._dbName);
	}

	/**
	 * This function pushes a given request into the IndexedDb Queue
	 *
	 * @param {Object} input
	 * @param {Request} input.request The request which is to be queued
	 *
	 * @return {Promise} Promise which resolves when the request is pushed in
	 * the queue.
	 */
	pushIntoQueue({request}) {
		assert.isInstance({request}, Request);
		return this._queue.push({request});
	}

	/**
	 * Replays all the requests in the queue, this can be used for custom timing
	 * of replaying requests may be in an environment where sync event is not
	 * supported.
	 * @return {Promise} A listener for when the requests have been replayed.
	 */
	replayRequests() {
		return this._requestManager.replayRequests();
	}

  /**
	 * sets the dbName, which is used to store the queue and requests
	 * defaults to bgQueueSyncDB
	 * @param {String} id
	 * @param {String} dbName
	 * @return {Object} response Fetched response of the request.
	 */
	getResponse({id}) {
		return getResponse({
			id,
			dbName: this._dbName,
		});
	}
}

export default Queue;
