import RequestManager from './request-manager';
import RequestQueue from './request-queue';
import {maxAge} from './constants';
import assert from '../../../../lib/assert';
import IDBHelper from '../../../../lib/idb-helper';
import {getDbName} from './background-sync-idb-helper';

class BackgroundSyncQueue {
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

	pushIntoQueue({request}) {
		assert.isInstance({request}, Request);
		this._queue.push({request});
	}
}

export default BackgroundSyncQueue;
