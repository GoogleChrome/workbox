import RequestManager from './request-manager';
import RequestQueue from './request-queue';
import {maxAge} from './constants';
import assert from '../../../../lib/assert';
import IDBHelper from '../../../../lib/idb-helper';
import {getDbName} from './background-sync-idb-helper';

/**
 * Class which maily interacts with outer service worker
 *
 * @class BackgroundSyncQueue
 */
class BackgroundSyncQueue {
	/**
	 * Creates an instance of BackgroundSyncQueue.
	 *
	 * @param {Object} config
	 * @memberOf BackgroundSyncQueue
	 */
	constructor({maxRetentionTime = maxAge, callbacks, queueName} = {}) {
		if(queueName) {
			assert.isType({queueName}, 'string');
		}

		if(maxRetentionTime) {
			assert.isType({maxRetentionTime}, 'number');
		}

		this._queue = new RequestQueue({
			config: {
				maxAge: maxRetentionTime,
			},
			queueName,
			idbQDb: new IDBHelper(getDbName(), 1, 'QueueStore'),
		});
		this._requestManager = new RequestManager({callbacks, queue: this._queue});
	}

	/**
	 * Pushes a given request into the IDB queue
	 *
	 * @param {Request} request
	 * @return {void}
	 *
	 * @memberOf BackgroundSyncQueue
	 */
	pushIntoQueue({request}) {
		assert.isInstance({request}, Request);
		return this._queue.push({request});
	}
}

export default BackgroundSyncQueue;
