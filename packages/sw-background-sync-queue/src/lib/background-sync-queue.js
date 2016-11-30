import RequestManager from './request-manager';
import RequestQueue from './request-queue';
import {maxAge} from './constants';
import assert from '../../../../lib/assert';

class BackgroundSyncQueue {
	constructor({maxItemAge = maxAge, callbacks, queueName} = {}) {
		assert.isType({queueName}, 'string');
		assert.isType({queueName}, 'number');

		this._queue = new RequestQueue({
			config: {
				maxAge: maxItemAge,
			},
			queueName,
		});
		this._requestManager = new RequestManager({callbacks, queue: this._queue});
	}

	pushIntoQueue({request}) {
		assert.isInstance({request}, Request);
		this._queue.push({request});
	}
}

export default BackgroundSyncQueue;
