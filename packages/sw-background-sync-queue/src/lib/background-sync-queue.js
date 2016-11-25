import RequestManager from './request-manager';
import Queue from './queue';
import {maxAge} from './constants';

class BackgroundSyncQueue {
	constructor({config, callbacks, queueName}) {
		this._queue = new Queue(
			Object.assign({}, {maxAge: maxAge}, config),
			queueName);
		this._requestManager = new RequestManager({callbacks, queue: this._queue});
	}

	pushIntoQueue({request, config}) {
		this._queue.push({request, config});
	}
}

export default BackgroundSyncQueue;
