import RequestManager from './request-manager';
import RequestQueue from './request-queue';
import {maxAge} from './constants';
import assert from '../../../../lib/assert';
import IDBHelper from '../../../../lib/idb-helper';
import {getDbName} from './background-sync-idb-helper';

/**
 * BackgroundSync class that exposes public function of underlying libraries
 *
 * @class BackgroundSyncQueue
 * @private
 */
class BackgroundSyncQueue {
	/**
	 * Creates an instance of BackgroundSyncQueue.
	 *
	 * @param {Object} config
	 * @memberOf BackgroundSyncQueue
	 * @private
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
	 * Pushes a given request into the IDB queue
	 *
	 * @param {Request} request
	 * @return {void}
	 *
	 * @memberOf BackgroundSyncQueue
	 * * @private
	 */
	pushIntoQueue({request}) {
		assert.isInstance({request}, Request);
		return this._queue.push({request});
	}
}

export default BackgroundSyncQueue;
